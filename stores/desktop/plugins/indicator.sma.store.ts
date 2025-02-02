import { DesktopService } from '@desktop-data/desktop-data';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Response } from 'types/response';
import { IndicatorSmaParams, IndicatorSmaState } from 'types/indicator-sma';
import { map } from 'rxjs/operators';
import { SeriesSplineOptions } from 'highcharts';
import { indicatorTransformToSeries } from 'utils/indicators-func';
import { WithQueue } from '../core/with-queue.abstract';
import { getJoinUniq } from 'utils/get-join-uniq';

export class IndicatorSmaStore extends WithQueue<IndicatorSmaState> {
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
        this._getIndicator(data).pipe(
          tap((series) => this.updateSeries(series)),
          catchError((err) => {
            return of({
              data: null,
              message: err.message,
              success: false,
            });
          })
        )
      )
    )
  );

  private _getIndicator(data: IndicatorSmaParams | null): Observable<any> {
    if (data === null) {
      return of(null);
    }

    const uniqKey = getJoinUniq(data.id, data.interval, ...data.types);
    const value = this.queue.getValue(uniqKey);

    if (value) {
      return of(value);
    }

    if (data.types.length === 0) {
      this.queue.setValue(uniqKey, []);

      return of([]);
    }

    return this._api.getIndicatorSma(data).pipe(
      map((res: Response<any>) => res.data && indicatorTransformToSeries(res.data)),
      map((list: SeriesSplineOptions[]) => list.map((item: SeriesSplineOptions) => ({ ...item, instrument: data.id }))),
      tap((value: SeriesSplineOptions[]) => this.queue.setValue(uniqKey, value))
    );
  }
}
