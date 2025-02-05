import { FacadeStore } from './facade';
import { SelectStore } from './select.store';
import { DesktopService } from '@desktop-data/desktop-data';
import {
  combineLatest,
  distinctUntilChanged,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { StockEvent } from 'types/stock-event';
import { filter, map } from 'rxjs/operators';
import { EventSelected } from 'types/events';
import { ComponentStore } from '@ngrx/component-store';
import { StockId, StockInstrument, StockListItems, StockPrice, StockTransaction, WithLastPrice } from 'types/stock';
import { Position } from 'types/position';
import { DateRange } from 'types/date-range';
import { Timeframe } from 'types/timeframe';
import { GLOBAL_DATE_RANGE, QUERY_PARAMS } from 'tokens/desktop';
import { PortfolioPosition } from 'types/portfolio';
import { IntervalStore } from 'stores/plugins/interval.store';
import { QueryParams } from 'utils/query-params';

const TIMER_INTERVAL = 60 * 1000;

const timerWithIndex = <T>(
  source$: Observable<T>,
  interval: number = 10000,
  start: number = 0
): Observable<{ source: T; index: number }> => {
  return source$.pipe(
    switchMap((source: T) => timer(start, interval).pipe(map((index: number) => ({ source, index }))))
  );
};

@Injectable()
export class MainStore extends ComponentStore<any> {
  private readonly _today = new Date(new Date().setUTCHours(0, 0, 0, 0));
  private readonly _range$: Observable<DateRange> = inject(GLOBAL_DATE_RANGE);
  private _destroyed$ = new Subject<void>();
  private _queryParams: QueryParams = inject(QUERY_PARAMS);

  private readonly _facade = new FacadeStore(this.api, this._queryParams);

  readonly account = this._facade.account;
  readonly interval = new IntervalStore();
  readonly selected = new SelectStore();
  readonly stock = this._facade.stockList;
  readonly idea = this._facade.ideaList;
  readonly position = this._facade.positionList;
  readonly price = this._facade.priceList;
  readonly candles = this._facade.candles;
  readonly sma = this._facade.sma;
  readonly ema = this._facade.ema;
  readonly consolidationZones = this._facade.consolidationZones;
  readonly consolidationZonesIdea = this._facade.consolidationZonesIdea;
  readonly consolidationZonesWatch = this._facade.consolidationZonesWatch;
  readonly figures = this._facade.figures;
  readonly atr = this._facade.atr;
  readonly portfolio = this._facade.portfolio;

  constructor(private readonly api: DesktopService) {
    super();

    this._init();
  }

  private _init(): void {
    const timerSource = timer(0, TIMER_INTERVAL).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    const interval$: Observable<Timeframe> = this.interval.interval$.pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const instrumentTrust$: Observable<StockInstrument> = this.selected.instrument$.pipe(
      filter((instrument: StockInstrument | null): instrument is StockInstrument => instrument !== null),
      shareReplay({ refCount: true, bufferSize: 1 })
    );

    this.stock.loadList();
    this.stock.loadGroup();

    this.account.loadBrokers();
    this.account.loadCurrencies();
    this.account.loadPortfolios();
    this.account.loadStrategies();

    this.idea.load(timerSource);
    this.position.load(timerSource);

    this.onChangeInstrument(this.selected.event$);
    this.onChangePosition(this.selected.event$);
    this.onChangeIdea(this.selected.event$);
    this.onChangeWatch(this.selected.event$);
    this.onChangeTransaction(this.selected.event$);

    this.candles.loadCandles(
      timerWithIndex(
        instrumentTrust$.pipe(distinctUntilChanged((a: StockInstrument, b: StockInstrument) => a.id === b.id)),
        TIMER_INTERVAL
      )
    );

    this.ema.load(
      combineLatest([
        instrumentTrust$.pipe(map((instrument: StockInstrument) => instrument.id)),
        this.ema.selected$.pipe(filter((selected: null | any): selected is any => selected !== null)),
        this._range$,
        interval$,
      ]).pipe(
        map(([id, types, period, interval]: [string, string[], DateRange, Timeframe]) => ({
          id,
          types,
          period,
          interval,
        }))
      )
    );
    this.sma.load(
      combineLatest([
        instrumentTrust$.pipe(map((instrument: StockInstrument) => instrument.id)),
        this.sma.selected$.pipe(filter((selected: null | any): selected is any => selected !== null)),
        this._range$,
        interval$,
      ]).pipe(
        map(([id, types, period, interval]: [string, string[], DateRange, Timeframe]) => ({
          id,
          types,
          period,
          interval,
        }))
      )
    );
    this.consolidationZones.load(
      combineLatest([
        instrumentTrust$.pipe(map((instrument: StockInstrument) => instrument.id)),
        this.consolidationZones.selected$.pipe(
          filter((selected: number[] | null): selected is number[] => selected !== null)
        ),
        this._range$,
      ]).pipe(
        map(([id, zones, range]: [string, number[] | null, DateRange]) => {
          if (zones === null || zones.length === 0) {
            return null;
          }

          return {
            id,
            interval: zones,
            ...range,
          };
        })
      )
    );
    this.consolidationZonesIdea.load(
      merge(this.selected.idea$, this.selected.position$, this.selected.transaction$).pipe(
        filter((instrument: null | StockTransaction): instrument is StockTransaction => instrument !== null),
        distinctUntilChanged((a, b) => a.ideaId !== b.ideaId)
      )
    );
    this.consolidationZonesWatch.load(
      this.selected.event$.pipe(
        filter((event: null | StockEvent): event is StockEvent => event !== null),
        map((event: StockEvent) => (event.type === EventSelected.WATCH_LIST ? event : null)),
        distinctUntilChanged()
      )
    );
    this.figures.load(
      merge(this.selected.idea$, this.selected.position$, this.selected.transaction$).pipe(distinctUntilChanged())
    );
    this.atr.load(
      combineLatest([
        instrumentTrust$.pipe(
          map((instrument: StockInstrument) => instrument.id),
          distinctUntilChanged()
        ),
        this.atr.selected$.pipe(distinctUntilChanged()),
        interval$,
      ]).pipe(
        map(([id, selected, interval]: [string, boolean, Timeframe]) => {
          if (!selected) {
            return null;
          }

          return {
            id,
            interval,
            date: this._today.toISOString(),
          };
        })
      )
    );
  }

  onLoadPrice = (stream$: StockId[] | null) => {
    this._destroyed$.next();

    return this.price.load(
      of(stream$).pipe(
        switchMap(() => timer(0, TIMER_INTERVAL)),
        takeUntil(this._destroyed$),
        map(() => stream$)
      )
    );
  };

  onChangeInstrument = this.effect((source$: Observable<null | StockEvent>) =>
    combineLatest([
      source$.pipe(
        filter((event: StockEvent | null): event is StockEvent => event !== null),
        filter((event: StockEvent) => event.type === EventSelected.STOCK_LIST)
      ),
      this._facade.stockList.list$.pipe(filter((list: StockListItems | null): list is StockListItems => list !== null)),
    ]).pipe(
      tap(([event, list]: [StockEvent, StockListItems]) => {
        const find = list.find((item: StockInstrument) => item.id === event.id) || null;

        this._updateSelected(find, null, null, null, event.group);
      })
    )
  );

  onChangePosition = this.effect((source$: Observable<StockEvent | null>) =>
    combineLatest([
      source$.pipe(this._getIdFrom(EventSelected.POSITION)),
      this._facade.positionList.list$.pipe(filter((list: Position[] | null): list is Position[] => list !== null)),
    ]).pipe(
      filter((combine: [StockEvent | null, Position[]]): combine is [StockEvent, Position[]] => combine[0] !== null),
      tap(([event, list]: [StockEvent, Position[]]) => {
        const find = list.find((item: Position) => item.id === event.id) || null;

        if (find) {
          this._updateSelected(find.instrument, { ideaId: find.id, instrumentId: find.instrument.id });
        } else {
          this._queryParams.update({}, '');
          this._updateSelected();
        }
      })
    )
  );

  onChangeIdea = this.effect((source$: Observable<StockEvent | null>) =>
    combineLatest([
      source$.pipe(this._getIdFrom(EventSelected.IDEA)),
      this._facade.ideaList.list$.pipe(filter((list: Position[] | null): list is Position[] => list !== null)),
    ]).pipe(
      filter((combine: [StockEvent | null, Position[]]): combine is [StockEvent, Position[]] => combine[0] !== null),
      tap(([event, list]: [StockEvent, Position[]]) => {
        const find = list.find((item: Position) => item.id === event.id) || null;

        if (find) {
          this._updateSelected(find.instrument, null, { ideaId: find.id, instrumentId: find.instrument.id });
        } else {
          this._queryParams.update({}, '');
          this._updateSelected();
        }
      })
    )
  );

  onChangeWatch = this.effect((source$: Observable<StockEvent | null>) =>
    combineLatest([
      source$.pipe(this._getIdFrom(EventSelected.WATCH_LIST)),
      this._facade.stockList.list$.pipe(filter((list: StockListItems | null): list is StockListItems => list !== null)),
    ]).pipe(
      filter(
        (combine: [StockEvent | null, StockListItems]): combine is [StockEvent, StockListItems] => combine[0] !== null
      ),
      tap(([event, list]: [StockEvent, StockListItems]) => {
        const find = list.find((item: StockInstrument) => item.id === event.id) || null;
        this._updateSelected(find, null, null, null, event.group);
      })
    )
  );

  onChangeTransaction = this.effect((source$: Observable<StockEvent | null>) =>
    combineLatest([
      source$.pipe(this._getIdFrom(EventSelected.TRANSACTION)),
      this.portfolio.list$.pipe(
        filter((list: PortfolioPosition[] | null): list is PortfolioPosition[] => list !== null)
      ),
    ]).pipe(
      filter(
        (combine: [StockEvent | null, PortfolioPosition[]]): combine is [StockEvent, PortfolioPosition[]] =>
          combine[0] !== null
      ),
      tap(([event, list]: [StockEvent, PortfolioPosition[]]) => {
        const find = list.find((item: PortfolioPosition) => item.ideaId === event.id) || null;

        if (find) {
          this._updateSelected(find.instrument, null, null, { ideaId: find.ideaId, instrumentId: find.instrument.id });
        } else {
          this._queryParams.update({}, '');
          this._updateSelected();
        }
      })
    )
  );

  getPriceOfInstruments = (list: StockId[]): Observable<StockPrice<WithLastPrice>> => this.api.getActiveStock(list);

  private _updateSelected(
    instrument: StockInstrument | null = null,
    position: StockTransaction | null = null,
    idea: StockTransaction | null = null,
    transaction: StockTransaction | null = null,
    group: StockId | null = null
  ): void {
    this.selected.updateInstrument(instrument);
    this.selected.updatePosition(position);
    this.selected.updateIdea(idea);
    this.selected.updateTransaction(transaction);
    this.selected.updateGroup(group);
  }

  private _getIdFrom(type: EventSelected) {
    return (source$: Observable<StockEvent | null>) =>
      source$.pipe(
        filter((event: null | StockEvent): event is StockEvent => event !== null),
        map((event: StockEvent) => (event.type === type ? event : null)),
        distinctUntilChanged()
      );
  }
}
