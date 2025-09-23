import { ComponentStore } from '@ngrx/component-store';
import { debounceTime, Observable, shareReplay } from 'rxjs';
import { StockId, StockTransaction } from 'types/stock';
import { StockEvent } from 'types/stock-event';
import { map } from 'rxjs/operators';

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
    debounceTime(100),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly common$: Observable<StockTransaction | null> = this.select(
    {
      ideaId: this.idea$,
      instrumentId: this.instrument$,
    },
    { debounce: true }
  ).pipe(
    map((data: { ideaId: null | StockId; instrumentId: null | string }) => {
      if (data.ideaId !== null && data.instrumentId !== null) {
        return data as StockTransaction;
      }

      return null;
    })
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
