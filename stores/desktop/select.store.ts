import { ComponentStore } from '@ngrx/component-store';
import { Observable, shareReplay } from 'rxjs';
import { StockId, StockInstrument } from 'types/stock';
import { Position } from 'types/position';
import { StockEvent } from 'types/stock-event';

export interface SelectState {
  event: null | StockEvent;
  instrument: null | StockInstrument;
  group: null | StockId;
  position: null | Position;
  idea: null | Position;
  list: null | StockId[];
}

export class SelectStore extends ComponentStore<SelectState> {
  readonly instrument$: Observable<null | StockInstrument> = this.select((state: SelectState) => state.instrument).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly group$: Observable<null | StockId> = this.select((state: SelectState) => state.group);
  readonly position$: Observable<null | Position> = this.select((state: SelectState) => state.position).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly idea$: Observable<null | Position> = this.select((state: SelectState) => state.idea).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly list$: Observable<null | StockId[]> = this.select((state: SelectState) => state.list).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly event$: Observable<null | StockEvent> = this.select((state: SelectState) => state.event).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  constructor() {
    super({
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

  updatePosition = this.updater((state: SelectState, position: null | Position) => ({
    ...state,
    position,
  }));

  updateIdea = this.updater((state: SelectState, idea: null | Position) => ({
    ...state,
    idea,
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
