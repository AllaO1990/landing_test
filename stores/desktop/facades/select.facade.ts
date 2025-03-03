import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable } from 'rxjs';
import { StockId, StockInstrument, StockTransaction } from 'types/stock';
import { StockEvent } from 'types/stock-event';

@Injectable()
export class SelectFacade {
  private readonly _store: MainStore = inject(MainStore);
  private readonly _select = this._store.selected;

  readonly instrument$: Observable<null | StockInstrument> = this._select.instrument$;
  readonly position$: Observable<null | StockTransaction> = this._select.position$;
  readonly idea$: Observable<null | StockTransaction> = this._select.idea$;
  readonly transaction$: Observable<null | StockTransaction> = this._select.transaction$;
  readonly list$: Observable<null | StockId[]> = this._select.list$;
  readonly event$: Observable<null | StockEvent> = this._select.event$;

  updateEvent(event: null | StockEvent): void {
    this._select.updateEvent(event);
  }

  // updateInstrument(instrument: null | StockInstrument): void {
  //   this._select.updateInstrument(instrument);
  // }

  updateList(list: null | StockId[]): void {
    this._select.updateList(list);
  }

  updateGroup(group: null | StockId): void {
    this._select.updateGroup(group);
  }
}
