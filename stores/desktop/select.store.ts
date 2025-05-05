import { ComponentStore } from '@ngrx/component-store';
import { Observable, shareReplay } from 'rxjs';
import { StockId } from 'types/stock';
import { StockEvent } from 'types/stock-event';

export interface SelectState {
  event: null | StockEvent;
  instrument: null | string;
  group: null | string;
  idea: null | StockId;
}

export class SelectStore extends ComponentStore<SelectState> {
  readonly instrument$: Observable<null | string> = this.select((state: SelectState) => state.instrument).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly idea$: Observable<null | StockId> = this.select((state: SelectState) => state.idea).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly event$: Observable<null | StockEvent> = this.select((state: SelectState) => state.event).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly common$: Observable<{
    ideaId: StockId | null;
    instrumentId: string | null;
  }> = this.select(
    {
      ideaId: this.idea$,
      instrumentId: this.instrument$,
    },
    { debounce: true }
  );

  constructor() {
    super({
      instrument: null,
      idea: null,
      event: null,
      group: null,
    });
  }

  updateInstrument = this.updater((state: SelectState, instrument: null | string) => ({
    ...state,
    instrument,
  }));

  updateGroup = this.updater((state: SelectState, group: null | string) => ({
    ...state,
    group,
  }));

  updateIdea = this.updater((state: SelectState, idea: null | StockId) => ({
    ...state,
    idea,
  }));

  updateEvent = this.updater((state: SelectState, event: null | StockEvent) => ({
    ...state,
    event,
  }));
}
