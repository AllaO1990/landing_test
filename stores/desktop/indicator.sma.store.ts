import { ComponentStore } from '@ngrx/component-store';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, of, switchMap, tap } from 'rxjs';
import { Queue } from 'utils/queue';
import { Response } from 'types/response';
import { map } from 'rxjs/operators';
import { SeriesSplineOptions } from 'highcharts';
import { IndicatorSmaParams, IndicatorSmaState } from 'types/indicator-sma';

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
      ),
      tap((data) => console.log(data))
    )
  );

  private _getIndicator(data: IndicatorSmaParams | null): Observable<any> {
    if (data === null) {
      return of(null);
    }

    const uniqKey = this._getUniq(data);
    const value = this._queue.getValue(uniqKey);

    if (value) {
      return of(value);
    }

    return this._api.getIndicatorSma(data).pipe(
      map((res: Response<any>) => this._transformToSeries(res.data)),
      tap((value: SeriesSplineOptions[]) => this._queue.setValue(uniqKey, value))
    );
  }

  private _getUniq(data: IndicatorSmaParams): string {
    return `${data.id}'◬'${data.interval}'◬'${data.types.join('◬')}`;
  }

  private _transformToSeries(data: { dates: string[] } & { [key: string]: number[] }): SeriesSplineOptions[] {
    const series: { id: string; type: 'spline'; data: [number, number][] }[] = Object.keys(data)
      .filter((item: string) => item !== 'dates')
      .map((item: string) => ({
        id: item,
        type: 'spline',
        data: [],
      }));

    return data.dates.reduce((acc, item: string, index: number) => {
      const valueOf = new Date(item).valueOf();

      acc.forEach((row: { id: string; data: [number, number][] }) => {
        row.data.push([valueOf, data[row.id][index]]);
      });

      return acc;
    }, series);
  }
}
