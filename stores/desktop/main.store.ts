import { FacadeStore } from './facade';
import { SelectStore } from './select.store';
import { DesktopService } from '@desktop-data/desktop-data';
import { combineLatest, distinctUntilChanged, Observable, shareReplay, tap, timer } from 'rxjs';
import { Injectable } from '@angular/core';
import { StockEvent } from 'types/stock-event';
import { filter, map } from 'rxjs/operators';
import { EventSelected } from 'types/events';
import { ComponentStore } from '@ngrx/component-store';
import { StockId, StockInstrument, StockListItems } from 'types/stock';

const TIMER_INTERVAL = 60 * 1000;

@Injectable()
export class MainStore extends ComponentStore<any> {
  private readonly _facade = new FacadeStore(this.api);

  readonly selected = new SelectStore();
  readonly stock = this._facade.stockList;
  readonly idea = this._facade.ideaList;
  readonly position = this._facade.positionList;

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
  }

  onChangeInstrument = this.effect((source$: Observable<null | StockEvent>) =>
    combineLatest([
      source$.pipe(
        filter((event: null | StockEvent): event is StockEvent => event !== null),
        filter((event: StockEvent) => event.type === EventSelected.STOCK_LIST),
        map((event: StockEvent) => event.id),
        distinctUntilChanged()
      ),
      this._facade.stockList.list$.pipe(filter((list: StockListItems | null): list is StockListItems => list !== null)),
    ]).pipe(
      map(([id, list]: [StockId, StockListItems]) => list.find((item: StockInstrument) => item.id === id)),
      tap((instrument: StockInstrument | undefined) => this.selected.updateInstrument(instrument || null))
    )
  );
}
