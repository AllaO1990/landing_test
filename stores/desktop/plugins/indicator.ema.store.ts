import { DesktopService } from '@desktop-data/desktop-data';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Response } from 'types/response';
import { IndicatorEmaParams, IndicatorEmaState } from 'types/indicator-ema';
import { map } from 'rxjs/operators';
import { SeriesSplineOptions } from 'highcharts';
import { indicatorTransformToSeries } from 'utils/indicators-func';
import { WithQueue } from '../core/with-queue.abstract';
import { getJoinUniq } from 'utils/get-join-uniq';

export class IndicatorEmaStore extends WithQueue<IndicatorEmaState> {
  readonly selected$: Observable<null | any> = this.select((state: IndicatorEmaState) => state.selected);

  readonly series$: Observable<null | any> = this.select((state: IndicatorEmaState) => state.series);

  constructor(private readonly _api: DesktopService) {
    super({
      selected: null,
      series: null,
    });
  }

  updateSelected = this.updater((state: IndicatorEmaState, selected: any) => ({ ...state, selected }));

  updateSeries = this.updater((state: IndicatorEmaState, series: any) => ({ ...state, series }));

  readonly load = this.effect((stream$: Observable<IndicatorEmaParams | null>) =>
    stream$.pipe(
      switchMap((data: IndicatorEmaParams | null) =>
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

  private _getIndicator(data: IndicatorEmaParams | null): Observable<any> {
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

    return this._api.getIndicatorEma(data).pipe(
      map((res: Response<any>): null | SeriesSplineOptions[] => res.data && indicatorTransformToSeries(res.data)),
      map(
        (list: SeriesSplineOptions[] | null) =>
          list &&
          list.map((item: SeriesSplineOptions) => ({
            ...item,
            instrument: data.id,
          }))
      ),
      tap((value: SeriesSplineOptions[] | null) => this.queue.setValue(uniqKey, value))
    );
  }
}
