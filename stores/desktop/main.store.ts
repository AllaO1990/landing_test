import { FacadeStore } from './facade';
import { SelectStore } from './select.store';
import { DesktopService } from '@desktop-data/desktop-data';
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { Injectable } from '@angular/core';
import { StockEvent } from 'types/stock-event';
import { filter, map } from 'rxjs/operators';
import { EventSelected } from 'types/events';
import { ComponentStore } from '@ngrx/component-store';
import { StockId, StockInstrument, StockListItems } from 'types/stock';
import { Position } from 'types/position';
import { Idea } from 'types/idea';

const TIMER_INTERVAL = 60 * 1000;

@Injectable()
export class MainStore extends ComponentStore<any> {
  private _destroyed$ = new Subject<void>();

  private readonly _facade = new FacadeStore(this.api);

  readonly selected = new SelectStore();
  readonly stock = this._facade.stockList;
  readonly idea = this._facade.ideaList;
  readonly position = this._facade.positionList;
  readonly price = this._facade.priceList;

  constructor(private readonly api: DesktopService) {
    super();

    this._init();
  }

  private _init(): void {
    const timerSource = timer(0, TIMER_INTERVAL).pipe(
      shareReplay({
        bufferSize: 1,
        refCount: true,
      })
    );

    this.stock.loadList();
    this.stock.loadGroup();

    this.idea.load(timerSource);
    this.position.load(timerSource);

    this.onChangeInstrument(this.selected.event$);
    this.onChangePosition(this.selected.event$);
    this.onChangeIdea(this.selected.event$);
    this.onChangeWatch(this.selected.event$);
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
      source$.pipe(this._getIdFrom(EventSelected.STOCK_LIST)),
      this._facade.stockList.list$.pipe(filter((list: StockListItems | null): list is StockListItems => list !== null)),
    ]).pipe(
      map(([id, list]: [StockId, StockListItems]) => list.find((item: StockInstrument) => item.id === id) || null),
      tap((instrument: StockInstrument | null) => this._updateSelected(instrument))
    )
  );

  onChangePosition = this.effect((source$: Observable<StockEvent | null>) =>
    combineLatest([
      source$.pipe(this._getIdFrom(EventSelected.POSITION)),
      this._facade.positionList.list$.pipe(filter((list: Position[] | null): list is Position[] => list !== null)),
    ]).pipe(
      map(([id, list]: [StockId, Position[]]) => list.find((item: Position) => item.id === id) || null),
      tap((position: Position | null) => this._updateSelected(position && position.instrument, position || null))
    )
  );

  onChangeIdea = this.effect((source$: Observable<StockEvent | null>) =>
    combineLatest([
      source$.pipe(this._getIdFrom(EventSelected.IDEA)),
      this._facade.ideaList.list$.pipe(filter((list: Idea[] | null): list is Idea[] => list !== null)),
    ]).pipe(
      map(([id, list]: [StockId, Idea[]]) => list.find((item: Idea) => item.id === id)),
      tap((idea: Idea | undefined) => this._updateSelected(idea && idea.instrument, null, idea || null))
    )
  );

  onChangeWatch = this.effect((source$: Observable<StockEvent | null>) =>
    combineLatest([
      source$.pipe(this._getIdFrom(EventSelected.WATCH_LIST)),
      this._facade.stockList.list$.pipe(filter((list: StockListItems | null): list is StockListItems => list !== null)),
    ]).pipe(
      map(([id, list]: [StockId, StockListItems]) => list.find((item: StockInstrument) => item.id === id) || null),
      tap((instrument: StockInstrument | null) => this._updateSelected(instrument, null, null, instrument))
    )
  );

  private _updateSelected(
    instrument: StockInstrument | null = null,
    position: Position | null = null,
    idea: Idea | null = null,
    watch: StockInstrument | null = null
  ): void {
    this.selected.updateInstrument(instrument);
    this.selected.updatePosition(position);
    this.selected.updateIdea(idea);
    this.selected.updateWatch(watch);
  }

  private _getIdFrom(type: EventSelected) {
    return (source$: Observable<StockEvent | null>) =>
      source$.pipe(
        filter((event: null | StockEvent): event is StockEvent => event !== null),
        filter((event: StockEvent) => event.type === type),
        map((event: StockEvent) => event.id),
        distinctUntilChanged()
      );
  }
}
