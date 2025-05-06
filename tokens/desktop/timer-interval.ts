import { InjectionToken } from '@angular/core';
import { TimerInterval } from '../../utils/timer-interval';

export const TIMER_INTERVAL: InjectionToken<TimerInterval> = new InjectionToken<TimerInterval>('Timer Interval');
