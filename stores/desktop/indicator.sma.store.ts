import { ComponentStore } from '@ngrx/component-store';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, of, switchMap, tap } from 'rxjs';
import { Queue } from 'utils/queue';
import { Response } from 'types/response';
import { map } from 'rxjs/operators';
import { SeriesSplineOptions } from 'highcharts';
import { IndicatorSmaParams, IndicatorSmaState } from 'types/indicator-sma';
import { indicatorGetUniq, indicatorTransformToSeries } from 'utils/indicators-func';

export class IndicatorSmaStore extends ComponentStore<IndicatorSmaState> {
  private _queue: Queue<any> = new Queue(3);

  readonly selected$: Observable<null | any> = this.select((state: IndicatorSmaState) => state.selected);

  readonly series$: Observable<null | any> = this.select((state: IndicatorSmaState) => state.series);

  constructor(private readonly _api: DesktopService) {
    super({
      selected: null,
      series: null,
    });
  }

  updateSelected = this.updater((state: IndicatorSmaState, selected: any) => ({ ...state, selected }));

  updateSeries = this.updater((state: IndicatorSmaState, series: any) => ({ ...state, series }));

  readonly load = this.effect((stream$: Observable<IndicatorSmaParams | null>) =>
    stream$.pipe(
      switchMap((data: IndicatorSmaParams | null) =>
        this._getIndicator(data).pipe(tap((series) => this.updateSeries(series)))
      )
    )
  );

  private _getIndicator(data: IndicatorSmaParams | null): Observable<any> {
    if (data === null) {
      return of(null);
    }

    const uniqKey = indicatorGetUniq(data.id, data.interval, ...data.types);
    const value = this._queue.getValue(uniqKey);

    if (value) {
      return of(value);
    }

    if (data.types.length === 0) {
      this._queue.setValue(uniqKey, []);

      return of([]);
    }

    return this._api.getIndicatorSma(data).pipe(
      map((res: Response<any>) => res.data && indicatorTransformToSeries(res.data)),
      tap((value: SeriesSplineOptions[]) => this._queue.setValue(uniqKey, value))
    );
  }
}
