import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable } from 'rxjs';
import { StockId, StockInstrument } from 'types/stock';
import { Idea } from 'types/idea';
import { StockEvent } from 'types/stock-event';
import { Position } from 'types/position';

@Injectable()
export class SelectFacade {
  private readonly _store: MainStore = inject(MainStore);
  private readonly _select = this._store.selected;

  readonly instrument$: Observable<null | StockInstrument> = this._select.instrument$;
  readonly position$: Observable<null | Position> = this._select.position$;
  readonly idea$: Observable<null | Idea> = this._select.idea$;
  // readonly group$: Observable<null | StockId> = this._select.group$;
  readonly list$: Observable<null | StockId[]> = this._select.list$;
  readonly event$: Observable<null | StockEvent> = this._select.event$;

  updateEvent(event: null | StockEvent): void {
    this._select.updateEvent(event);
  }

  updateInstrument(instrument: null | StockInstrument): void {
    this._select.updateInstrument(instrument);
  }

  updateList(list: null | StockId[]): void {
    this._select.updateList(list);
  }

  updateGroup(group: null | StockId): void {
    this._select.updateGroup(group);
  }
}
