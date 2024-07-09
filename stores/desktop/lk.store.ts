import { Injectable } from '@angular/core';
import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { distinctUntilChanged, Observable, switchMap, tap, timer } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ActiveZone } from 'types/chart';
import { EventSelected } from 'types/events';
import { Idea } from 'types/idea';
import { DesktopLkState } from 'types/lk-state';
import { StockId, StockInstrument, StockList, StockPrice, WithLastPrice } from 'types/stock';
import { StockEvent } from 'types/stock-event';
import { ChartStore } from './chart-store';
import { EntryStore } from './entry.store';
import { StockListStore } from './stock-list.store';
import { PositionStore } from './position.store';
import { Position } from 'types/position';

const TIMER_INTERVAL = 0.1 * 60 * 60 * 1000;

@Injectable()
export class DesktopLkStore extends ComponentStore<DesktopLkState> {
  public readonly event$: Observable<StockEvent | null> = this.select((state: DesktopLkState) => state.event);

  public readonly selectedInstrument$: Observable<StockInstrument | null> = this._stockListStore.selected$;

  public readonly selectedIdea$: Observable<Idea | null> = this._entryStore.selected$;

  public readonly selectedPosition$: Observable<Position | null> = this._positionStore.selected$;

  public readonly stock$: Observable<StockList | null> = this._stockListStore.list$;

  public readonly entry$: Observable<Idea[] | null> = this._entryStore.list$;

  public readonly position$: Observable<Position[] | null> = this._positionStore.list$;

  public readonly candles$: Observable<any[] | null> = this._chartStore.candles$;

  public readonly consolidationZones$: Observable<ActiveZone[] | null> = this._chartStore.consolidationZones$;

  public readonly stockActive$: Observable<StockId[] | null> = this.select(
    this._stockListStore.active$.pipe(filter((result: StockId[] | null): result is StockId[] => result !== null)),
    this._entryStore.active$.pipe(filter((result: StockId[] | null): result is StockId[] => result !== null)),
    this._stockListStore.selected$.pipe(
      filter((result: StockInstrument | null): result is StockInstrument => result !== null),
      map((result: StockInstrument) => result.id),
      distinctUntilChanged()
    ),
    (stock: StockId[], entry: StockId[], selectId: StockId) => [...stock, ...entry, selectId],
    { debounce: true }
  );

  public readonly price$: Observable<StockPrice<WithLastPrice> | null> = this.select(
    (state: DesktopLkState) => state.price
  );

  constructor(
    private readonly _api: DesktopService,
    private readonly _stockListStore: StockListStore,
    private readonly _entryStore: EntryStore,
    private readonly _positionStore: PositionStore,
    private readonly _chartStore: ChartStore
  ) {
    super({
      event: null,
      selected: null,
      price: null,
    });

    this._stockListStore.load();
    this._entryStore.load();
    this._positionStore.load();

    this.loadActivePrice(
      this._timer(this.stockActive$, TIMER_INTERVAL).pipe(map((value: { source: StockId[] | null }) => value.source))
    );

    this._chartStore.loadCandles(this._timer(this._stockListStore.selected$, TIMER_INTERVAL));

    this._chartStore.loadConsolidationZonesV2(this._entryStore.selected$);

    this.onChangeEventStock(this.event$);
    this.onChangeEventEntry(this.event$);
    this.onChangeEventPosition(this.event$);
  }

  public updateSelect = this.updater((state: DesktopLkState, selected: any) => ({ ...state, selected }));

  public updateEvent = this.updater((state: DesktopLkState, event: StockEvent) => ({ ...state, event }));

  public updatePrice = this.updater(
    (state: DesktopLkState, price: StockPrice<WithLastPrice>): DesktopLkState => ({ ...state, price })
  );

  public updateStockActive = this._stockListStore.updateActive;

  public readonly loadActivePrice = this.effect((stream$: Observable<StockId[] | null>) =>
    stream$.pipe(
      filter((list: StockId[] | null): list is StockId[] => !!list),
      switchMap((list: StockId[]) => this._api.getActiveStock(list)),
      tap((result: StockPrice<WithLastPrice>) => this.updatePrice(result))
    )
  );

  public readonly onChangeEventStock = this.effect((stream$: Observable<StockEvent | null>) =>
    stream$.pipe(
      filter((event: StockEvent | null): event is StockEvent => event !== null),
      filter((event: StockEvent): boolean => event.type === EventSelected.STOCK_LIST),
      switchMap((event: StockEvent) =>
        this.stock$.pipe(
          filter((list: StockList | null): list is StockList => list !== null),
          map((list: StockList): StockInstrument => list.find((item: StockInstrument) => item.id === event.id)!),
          tap((value: StockInstrument) => {
            this._stockListStore.updateSelected(value);
            this._entryStore.updateSelected(null);
            this._positionStore.updateSelected(null);
          })
        )
      )
    )
  );

  public readonly onChangeEventEntry = this.effect((stream$: Observable<StockEvent | null>) =>
    stream$.pipe(
      filter((event: StockEvent | null): event is StockEvent => event !== null),
      filter((event: StockEvent): boolean => event.type === EventSelected.IDEA),
      switchMap((event: StockEvent) =>
        this.entry$.pipe(
          filter((list: Idea[] | null): list is Idea[] => list !== null),
          map((list: Idea[]): Idea => list.find((item: Idea) => item.id === +event.id)!),
          tap((value: Idea) => {
            this._stockListStore.updateSelected(value.instrument);
            this._entryStore.updateSelected(value);
            this._positionStore.updateSelected(null);
          })
        )
      )
    )
  );

  public readonly onChangeEventPosition = this.effect((stream$: Observable<StockEvent | null>) =>
    stream$.pipe(
      filter((event: StockEvent | null): event is StockEvent => event !== null),
      filter((event: StockEvent): boolean => event.type === EventSelected.POSITION),
      switchMap((event: StockEvent) =>
        this.position$.pipe(
          filter((list: Position[] | null): list is Position[] => list !== null),
          map((list: Position[]): Position => list.find((item: Position) => item.id === +event.id)!),
          tap((value: Position) => {
            this._stockListStore.updateSelected(value.instrument);
            this._entryStore.updateSelected(null);
            this._positionStore.updateSelected(value);
          })
        )
      )
    )
  );

  private _timer<T>(
    source$: Observable<T>,
    interval: number = 10000,
    start: number = 0
  ): Observable<{ source: T; index: number }> {
    return source$.pipe(
      switchMap((source: T) => timer(start, interval).pipe(map((index: number) => ({ source, index }))))
    );
  }
}
