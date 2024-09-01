import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { DateRange } from 'types/date-range';

@Injectable()
export class GlobalDateRangeService {
  private readonly _range$: Subject<DateRange> = new ReplaySubject<DateRange>(1);

  readonly range$: Observable<DateRange> = this._range$.asObservable();

  setRange(date: DateRange): void {
    this._range$.next(date);
  }
}

export const GLOBAL_DATE_RANGE: InjectionToken<Observable<DateRange>> = new InjectionToken<Observable<DateRange>>(
  'global date range',
  {
    factory: () => inject(GlobalDateRangeService).range$,
  }
);
