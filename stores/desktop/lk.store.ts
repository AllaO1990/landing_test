import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { filter, map, skipWhile } from 'rxjs/operators';
import { DesktopService } from '../../api/desktop-data/src/lib/desktop-data';
import { DesktopLkState } from '../../types/lk-state';
import { Response } from '../../types/response';
import {
  Stock,
  StockList,
  StockListItem,
  StockListPrice,
  StockPrice,
} from '../../types/stock';

@Injectable()
export class DesktopLkStore extends ComponentStore<DesktopLkState> {
  public readonly selected$: Observable<any | null> = this.select(
    (state: DesktopLkState) => state.selected
  );

  public readonly stock$: Observable<StockList | null> = this.select(
    (state: DesktopLkState) => state.stock
  );

  public readonly stockActive$: Observable<StockList | null> = this.select(
    (state: DesktopLkState) => state.active
  );

  public readonly price$: Observable<StockPrice<StockListPrice> | null> =
    this.select((state: DesktopLkState) => state.price);

  public readonly candles$: Observable<any[] | null> = this.select(
    (state: DesktopLkState) => state.candles
  );

  constructor(private readonly _api: DesktopService) {
    super({
      selected: null,
      stock: null,
      active: null,
      price: null,
      defaultPrice: null,
      candles: null,
    });

    this.loadStock();
    this.loadActivePrice(this.stockActive$);
    this.loadCandles(this.selected$);
  }

  public updateSelect = this.updater(
    (state: DesktopLkState, selected: any) => ({ ...state, selected })
  );

  public updateCandles = this.updater(
    (state: DesktopLkState, candles: any) => ({ ...state, candles })
  );

  public updateStock = this.updater(
    (state: DesktopLkState, stock: StockList) => {
      const defaultPrice = stock.reduce(
        (acc: StockPrice<StockListPrice>, item: StockListItem) => ({
          ...acc,
          [item.id]: null,
        }),
        {}
      );

      return { ...state, defaultPrice, stock };
    }
  );

  public updatePrice = this.updater(
    (state: DesktopLkState, price: StockPrice<StockListPrice>) => ({
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
        map((response: Response<StockPrice<StockListPrice>>) => response.data),
        tap((result: StockPrice<StockListPrice>) => this.updatePrice(result))
      )
  );

  public readonly loadCandles = this.effect((stream$: Observable<any>) =>
    stream$.pipe(
      skipWhile((value) => value === null),
      switchMap((data: any) => this._api.getCandles(data)),
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
      tap((value) => {
        this.updateCandles(value);
      }),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  private _timer<T>(source: Observable<T>): Observable<T> {
    return source;
  }
}
