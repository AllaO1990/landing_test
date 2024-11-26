import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable } from 'rxjs';
import { StockGroup, StockInstrument } from 'types/stock';
import { Position } from 'types/position';
import { Idea } from 'types/idea';
import { StockEvent } from 'types/stock-event';

@Injectable()
export class SelectFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly instrument$: Observable<null | StockInstrument> = this._store.selected.instrument$;
  readonly position$: Observable<null | Position> = this._store.selected.position$;
  readonly idea$: Observable<null | Idea> = this._store.selected.idea$;
  readonly group$: Observable<null | StockGroup> = this._store.selected.group$;
  readonly event$: Observable<null | StockEvent> = this._store.selected.event$;

  updateEvent(event: null | StockEvent): void {
    this._store.selected.updateEvent(event);
  }

  updateInstrument(instrument: null | StockInstrument): void {
    this._store.selected.updateInstrument(instrument);
  }
}
