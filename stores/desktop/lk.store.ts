import { inject, Injectable } from '@angular/core';
import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { combineLatest, forkJoin, merge, Observable, switchMap, tap, timer } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ActiveZone } from 'types/chart';
import { EventSelected } from 'types/events';
import { Idea } from 'types/idea';
import { DesktopLkState } from 'types/lk-state';
import { StockGroups, StockId, StockInstrument, StockListItems, StockPrice, WithLastPrice } from 'types/stock';
import { StockEvent } from 'types/stock-event';
import { ChartStore } from './chart-store';
import { EntryStore } from './entry.store';
import { StockListStore } from './stock-list.store';
import { PositionStore } from './position.store';
import { Position } from 'types/position';
import { breakArray } from 'utils/break-array';
import { IndicatorAtrStore } from './indicator.atr.store';
import { IndicatorEmaStore } from './indicator.ema.store';
import { DateRange } from 'types/date-range';
import { GLOBAL_DATE_RANGE } from 'tokens/desktop';
import { IndicatorSmaStore } from './indicator.sma.store';
import { Timeframe } from 'types/timeframe';

const TIMER_INTERVAL = 60 * 1000;

@Injectable()
export class DesktopLkStore extends ComponentStore<DesktopLkState> {
  private readonly _range$: Observable<DateRange> = inject(GLOBAL_DATE_RANGE);

  public readonly event$: Observable<StockEvent | null> = this.select((state: DesktopLkState) => state.event);

  public readonly selectedInstrument$: Observable<StockInstrument | null> = this._stockListStore.selected$;

  public readonly selectedIdea$: Observable<Idea | null> = this._entryStore.selected$;

  public readonly selectedPosition$: Observable<Position | null> = this._positionStore.selected$;

  public readonly stock$: Observable<StockListItems | null> = this._stockListStore.list$;

  readonly stockGroups$: Observable<StockGroups | null> = this._stockListStore.groups$;

  readonly stockMap$: Observable<Map<string, StockListItems> | null> = this._stockListStore.map$;

  public readonly entry$: Observable<Idea[] | null> = this._entryStore.list$;

  public readonly position$: Observable<Position[] | null> = this._positionStore.list$;

  public readonly candles$: Observable<any[] | null> = this._chartStore.candles$;

  public readonly consolidationZones$: Observable<ActiveZone[] | null> = this._chartStore.consolidationZones$;

  readonly indicatorEma$: Observable<any[]> = this._indicatorEmaStore.series$;

  readonly indicatorSma$: Observable<any[]> = this._indicatorSmaStore.series$;

  readonly indicatorAtr$: Observable<any> = this._indicatorAtrStore.selected$;

  public readonly stockActive$: Observable<StockId[] | null> = this.select(
    this._stockListStore.active$.pipe(filter((result: StockId[] | null): result is StockId[] => result !== null)),
    (stock: StockId[]) => [...stock],
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
    private readonly _chartStore: ChartStore,
    private readonly _indicatorAtrStore: IndicatorAtrStore,
    private readonly _indicatorEmaStore: IndicatorEmaStore,
    private readonly _indicatorSmaStore: IndicatorSmaStore
  ) {
    super({
      event: null,
      selected: null,
      price: null,
    });

    this._stockListStore.loadList();
    this._stockListStore.load();
    this._entryStore.load(timer(0, TIMER_INTERVAL).pipe(map(() => void 0)));
    this._positionStore.load(timer(0, TIMER_INTERVAL).pipe(map(() => void 0)));

    this.loadActivePrice(
      this._timer(this.stockActive$, TIMER_INTERVAL).pipe(map((value: { source: StockId[] | null }) => value.source))
    );

    this._chartStore.loadCandles(this._timer(this._stockListStore.selected$, TIMER_INTERVAL));

    this._chartStore.loadConsolidationZonesV2(merge(this._entryStore.selected$, this._positionStore.selected$));

    this._chartStore.loadWatchlistConsolidationZones(
      this.event$.pipe(
        filter((event: StockEvent | null): event is StockEvent => event !== null),
        map((event: StockEvent) => (event.type === EventSelected.WATCH_LIST ? event : null))
      )
    );

    this.onChangeEventStock(this.event$);
    this.onChangeEventEntry(this.event$);
    this.onChangeEventPosition(this.event$);

    const stockInstrumentId$ = this._stockListStore.selected$.pipe(
      filter((selected: StockInstrument | null): selected is StockInstrument => selected !== null),
      map((instrument: StockInstrument) => instrument.id.toString())
    );

    this._indicatorEmaStore.load(
      combineLatest([stockInstrumentId$, this._indicatorEmaStore.selected$, this._range$]).pipe(
        map(([id, types, period]: [string, string[], DateRange]) => ({
          id,
          types,
          period,
          interval: Timeframe.CANDLE_INTERVAL_DAY,
        }))
      )
    );

    this._indicatorSmaStore.load(
      combineLatest([stockInstrumentId$, this._indicatorSmaStore.selected$, this._range$]).pipe(
        map(([id, types, period]: [string, string[], DateRange]) => ({
          id,
          types,
          period,
          interval: Timeframe.CANDLE_INTERVAL_DAY,
        }))
      )
    );

    const today = new Date(new Date().setUTCHours(0, 0, 0, 0));
    this._indicatorAtrStore.load(
      stockInstrumentId$.pipe(
        map((id: string) => ({ id, interval: Timeframe.CANDLE_INTERVAL_DAY, date: today.toISOString() }))
      )
    );
  }

  public updateSelect = this.updater((state: DesktopLkState, selected: any) => ({ ...state, selected }));

  public updateEvent = this.updater((state: DesktopLkState, event: StockEvent) => ({ ...state, event }));

  public updatePrice = this.updater(
    (state: DesktopLkState, price: StockPrice<WithLastPrice>): DesktopLkState => ({ ...state, price })
  );

  public updateIndicatorEmaSelected = this._indicatorEmaStore.updateSelected;

  public updateIndicatorSmaSelected = this._indicatorSmaStore.updateSelected;

  public readonly loadActivePrice = this.effect((stream$: Observable<StockId[] | null>) =>
    stream$.pipe(
      filter((list: StockId[] | null): list is StockId[] => !!list),
      switchMap((list: StockId[]) =>
        forkJoin(breakArray(list).map((subList: StockId[]) => this._api.getActiveStock(subList)))
      ),
      map((list: StockPrice<WithLastPrice>[]) => this._concatActivePrice(list)),
      tap((result: StockPrice<WithLastPrice>) => this.updatePrice(result))
    )
  );

  public updateStockActive = this._stockListStore.updateActive;

  readonly createStockList = this._stockListStore.create;

  readonly deleteStockList = this._stockListStore.delete;

  readonly editStockList = this._stockListStore.edit;

  readonly addStockInstrument = this._stockListStore.addInstrument;

  readonly deleteStockInstrument = this._stockListStore.deleteInstrument;

  public readonly onChangeEventStock = this.effect((stream$: Observable<StockEvent | null>) =>
    stream$.pipe(
      filter((event: StockEvent | null): event is StockEvent => event !== null),
      filter(
        (event: StockEvent): boolean =>
          event.type === EventSelected.STOCK_LIST || event.type === EventSelected.WATCH_LIST
      ),
      switchMap((event: StockEvent) =>
        this.stock$.pipe(
          filter((list: StockListItems | null): list is StockListItems => list !== null),
          map((list: StockListItems): StockInstrument => list.find((item: StockInstrument) => item.id === event.id)!),
          tap((value: StockInstrument) => {
            this._stockListStore.updateSelected({ ...value });
            this._entryStore.updateSelected(null);
            this._positionStore.updateSelected(null);
          })
        )
      )
    )
  );

  public readonly onChangeEventEntry = this.effect((stream$: Observable<StockEvent | null>) =>
    combineLatest([stream$, this.entry$]).pipe(
      filter(
        (result: [StockEvent | null, Idea[] | null]): result is [StockEvent, Idea[]] =>
          result[0] !== null && result[1] !== null
      ),
      filter(([event, _]: [StockEvent, Idea[]]): boolean => event.type === EventSelected.IDEA),
      map(([event, list]: [StockEvent, Idea[]]): Idea => list.find((item: Idea) => item.id === event.id)!),
      tap((value: Idea) => {
        this._stockListStore.updateSelected(value.instrument);
        this._entryStore.updateSelected(value);
        this._positionStore.updateSelected(null);
      })
    )
  );

  public readonly onChangeEventPosition = this.effect((stream$: Observable<StockEvent | null>) =>
    combineLatest([stream$, this.position$]).pipe(
      filter(
        (result: [StockEvent | null, Position[] | null]): result is [StockEvent, Position[]] =>
          result[0] !== null && result[1] !== null
      ),
      filter(([event, _]: [StockEvent, Position[]]): boolean => event.type === EventSelected.POSITION),
      map(([event, list]: [StockEvent, Position[]]): Position => list.find((item: Position) => item.id === event.id)!),
      tap((value: Position) => {
        this._stockListStore.updateSelected(value.instrument);
        this._entryStore.updateSelected(null);
        this._positionStore.updateSelected(value);
      })
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

  private _concatActivePrice(list: StockPrice<WithLastPrice>[]): StockPrice<WithLastPrice> {
    return list.reduce(
      (acc: StockPrice<WithLastPrice>, item: StockPrice<WithLastPrice>): StockPrice<WithLastPrice> => ({
        ...acc,
        ...item,
      }),
      {}
    );
  }
}
