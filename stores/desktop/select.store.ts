import { ComponentStore } from '@ngrx/component-store';
import { Observable, shareReplay } from 'rxjs';
import { StockId, StockInstrument, StockTransaction } from 'types/stock';
import { StockEvent } from 'types/stock-event';

export interface SelectState {
  event: null | StockEvent;
  instrument: null | StockInstrument;
  group: null | StockId;
  position: null | StockTransaction;
  transaction: null | StockTransaction;
  idea: null | StockTransaction;
  list: null | StockId[];
}

export class SelectStore extends ComponentStore<SelectState> {
  readonly instrument$: Observable<null | StockInstrument> = this.select((state: SelectState) => state.instrument).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly position$: Observable<null | StockTransaction> = this.select((state: SelectState) => state.position).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly idea$: Observable<null | StockTransaction> = this.select((state: SelectState) => state.idea).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly transaction$: Observable<null | StockTransaction> = this.select(
    (state: SelectState) => state.transaction
  ).pipe(shareReplay({ refCount: true, bufferSize: 1 }));
  readonly list$: Observable<null | StockId[]> = this.select((state: SelectState) => state.list).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly event$: Observable<null | StockEvent> = this.select((state: SelectState) => state.event).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  constructor() {
    super({
      transaction: null,
      instrument: null,
      position: null,
      idea: null,
      event: null,
      group: null,
      list: null,
    });
  }

  updateInstrument = this.updater((state: SelectState, instrument: null | StockInstrument) => ({
    ...state,
    instrument,
  }));

  updateGroup = this.updater((state: SelectState, group: null | StockId) => ({
    ...state,
    group,
  }));

  updatePosition = this.updater((state: SelectState, position: null | StockTransaction) => ({
    ...state,
    position,
  }));

  updateIdea = this.updater((state: SelectState, idea: null | StockTransaction) => ({
    ...state,
    idea,
  }));

  updateTransaction = this.updater((state: SelectState, transaction: null | StockTransaction) => ({
    ...state,
    transaction,
  }));

  updateEvent = this.updater((state: SelectState, event: null | StockEvent) => ({
    ...state,
    event,
  }));

  updateList = this.updater((state: SelectState, list: null | StockId[]) => ({
    ...state,
    list,
  }));
}
