import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap, timer } from 'rxjs';
import { filter, map, skipWhile } from 'rxjs/operators';
import { DesktopService } from '../../api/desktop-data/src/lib/desktop-data';
import { DesktopLkState } from 'types/lk-state';
import { Response } from 'types/response';
import {
  Stock,
  StockInstrument,
  StockList,
  StockPrice,
  WithLastPrice,
} from 'types/stock';
import { StockListStore } from './stock-list.store';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { EntryStore } from './entry.store';
import { Idea } from 'types/idea';

const TIMER_INTERVAL = 0.1 * 60 * 60 * 1000;

@Injectable()
export class DesktopLkStore extends ComponentStore<DesktopLkState> {
  public readonly selected$: Observable<{
    type: EventSelected;
    value: any;
  } | null> = this.select((state: DesktopLkState) => state.selected);

  public readonly stock$: Observable<StockList | null> =
    this._stockListStore.list$;

  public readonly entry$: Observable<Idea[] | null> = this._entryStore.list$;

  public readonly stockActive$: Observable<StockList | null> = this.select(
    (state: DesktopLkState) => state.active
  );

  public readonly price$: Observable<StockPrice<WithLastPrice> | null> =
    this.select((state: DesktopLkState) => state.price);

  public readonly candles$: Observable<any[] | null> = this.select(
    (state: DesktopLkState) => state.candles
  );

  constructor(
    private readonly _api: DesktopService,
    private readonly _queryParams: QueryParams,
    private readonly _stockListStore: StockListStore,
    private readonly _entryStore: EntryStore
  ) {
    super({
      selected: null,
      active: null,
      price: null,
      defaultPrice: null,
      candles: null,
    });

    this._stockListStore.load();

    this._entryStore.load();

    this._queryParams.subscribe((res) => console.log(res));

    this.loadActivePrice(
      this._timer(this.stockActive$, TIMER_INTERVAL).pipe(
        map((value: { source: StockList | null }) => value.source)
      )
    );

    this.loadCandles(this._timer(this.selected$, TIMER_INTERVAL));
  }

  public updateSelect = this.updater(
    (state: DesktopLkState, selected: any) => ({ ...state, selected })
  );

  public updateCandles = this.updater(
    (state: DesktopLkState, data: { candles: any; index: number }) => {
      const candlesArray = state.candles;
      if (data.index && candlesArray && data.candles) {
        for (let i = 0; i < data.candles.length; i++) {
          candlesArray[candlesArray.length - 1 - i] = data.candles[i];
        }
        return { ...state };
      } else {
        return { ...state, candles: data.candles };
      }
    }
  );

  public updateStock = this.updater(
    (state: DesktopLkState, stock: StockList) => {
      const defaultPrice = stock.reduce(
        (acc: StockPrice<WithLastPrice>, item: StockInstrument) => ({
          ...acc,
          [item.id]: null,
        }),
        {}
      );

      return { ...state, defaultPrice, stock };
    }
  );

  public updatePrice = this.updater(
    (state: DesktopLkState, price: StockPrice<WithLastPrice>) => ({
      ...state,
      price: { ...state.defaultPrice, ...price },
    })
  );

  public updateActive = this.updater(
    (state: DesktopLkState, active: StockList) => ({ ...state, active })
  );

  public readonly loadStock = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api.getStockList().pipe(
          filter((result: Response<Stock>) => !!result.data),
          tap((result: Response<Stock>) => this.updateStock(result.data.items))
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  public readonly loadActivePrice = this.effect(
    (stream$: Observable<StockList | null>) =>
      stream$.pipe(
        filter((list: StockList | null): list is StockList => !!list),
        switchMap((list: StockList) => this._api.getActiveStock(list)),
        map((response: Response<StockPrice<WithLastPrice>>) => response.data),
        tap((result: StockPrice<WithLastPrice>) => this.updatePrice(result))
      )
  );

  public readonly loadCandles = this.effect(
    (stream$: Observable<{ source: any | null; index: number }>) => {
      let index = 0;
      return stream$.pipe(
        tap((val) => {
          index = val.index;
        }),
        skipWhile((value) => value.source === null),
        switchMap((data: { source: any; index: number }) =>
          this._api.getCandles(data)
        ),
        map((data: any) => {
          return data.data.map((item: any) => {
            // x,open,high,low,close
            return [
              new Date(item.time).valueOf(),
              item.open,
              item.high,
              item.low,
              item.close,
            ];
          });
        }),
        tap((candles) => {
          this.updateCandles({ candles, index });
        }),
        catchError((err: Error) => {
          console.error(err);
          return of(null);
        })
      );
    }
  );

  private _timer<T>(
    source$: Observable<T>,
    interval: number = 10000,
    start: number = 0
  ): Observable<{ source: T; index: number }> {
    return source$.pipe(
      switchMap((source: T) =>
        timer(start, interval).pipe(map((index: number) => ({ source, index })))
      )
    );
  }
}
