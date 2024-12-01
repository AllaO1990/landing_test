import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { StockId, StockInstrument } from 'types/stock';
import { Position } from 'types/position';
import { Idea } from 'types/idea';
import { StockEvent } from 'types/stock-event';

export interface SelectState {
  event: null | StockEvent;
  instrument: null | StockInstrument;
  watch: null | StockInstrument;
  position: null | Position;
  idea: null | Idea;
  list: null | StockId[];
}

export class SelectStore extends ComponentStore<SelectState> {
  readonly instrument$: Observable<null | StockInstrument> = this.select((state: SelectState) => state.instrument);
  readonly watch$: Observable<null | StockInstrument> = this.select((state: SelectState) => state.watch);
  readonly position$: Observable<null | Position> = this.select((state: SelectState) => state.position);
  readonly idea$: Observable<null | Idea> = this.select((state: SelectState) => state.idea);
  readonly list$: Observable<null | StockId[]> = this.select((state: SelectState) => state.list);
  readonly event$: Observable<null | StockEvent> = this.select((state: SelectState) => state.event);

  constructor() {
    super({
      instrument: null,
      position: null,
      idea: null,
      event: null,
      watch: null,
      list: null,
    });
  }

  updateInstrument = this.updater((state: SelectState, instrument: null | StockInstrument) => ({
    ...state,
    instrument,
  }));

  updateWatch = this.updater((state: SelectState, watch: null | StockInstrument) => ({
    ...state,
    watch,
  }));

  updatePosition = this.updater((state: SelectState, position: null | Position) => ({
    ...state,
    position,
  }));

  updateIdea = this.updater((state: SelectState, idea: null | Idea) => ({
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
