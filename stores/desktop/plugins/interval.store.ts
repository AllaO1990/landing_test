import { ComponentStore } from '@ngrx/component-store';
import { Timeframe } from 'types/timeframe';
import { Observable } from 'rxjs';

export interface IntervalState {
  interval: Timeframe;
}

export class IntervalStore extends ComponentStore<IntervalState> {
  readonly interval$: Observable<Timeframe> = this.select((state: IntervalState) => state.interval);

  constructor() {
    super({
      interval: Timeframe.CANDLE_INTERVAL_DAY,
    });
  }

  updateInterval = this.updater((state: IntervalState, interval: Timeframe) => ({ ...state, interval }));
}
