import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { StockGroup, StockInstrument } from 'types/stock';
import { Position } from 'types/position';
import { Idea } from 'types/idea';
import { StockEvent } from 'types/stock-event';

export interface SelectState {
  event: null | StockEvent;
  instrument: null | StockInstrument;
  position: null | Position;
  idea: null | Idea;
  group: null | StockGroup;
}

export class SelectStore extends ComponentStore<SelectState> {
  readonly instrument$: Observable<null | StockInstrument> = this.select((state: SelectState) => state.instrument);
  readonly position$: Observable<null | Position> = this.select((state: SelectState) => state.position);
  readonly idea$: Observable<null | Idea> = this.select((state: SelectState) => state.idea);
  readonly group$: Observable<null | StockGroup> = this.select((state: SelectState) => state.group);
  readonly event$: Observable<null | StockEvent> = this.select((state: SelectState) => state.event);

  constructor() {
    super({
      instrument: null,
      position: null,
      idea: null,
      group: null,
      event: null,
    });
  }

  updateInstrument = this.updater((state: SelectState, instrument: null | StockInstrument) => ({
    ...state,
    instrument,
  }));

  updatePosition = this.updater((state: SelectState, position: null | Position) => ({
    ...state,
    position,
  }));

  updateIdea = this.updater((state: SelectState, idea: null | Idea) => ({
    ...state,
    idea,
  }));

  updateGroup = this.updater((state: SelectState, group: null | StockGroup) => ({
    ...state,
    group,
  }));

  updateEvent = this.updater((state: SelectState, event: null | StockEvent) => ({
    ...state,
    event,
  }));
}
