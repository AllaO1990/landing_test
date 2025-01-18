import { WithQueue } from '../core/with-queue.abstract';
import { DesktopService } from '@desktop-data/desktop-data';
import { catchError, EMPTY, Observable, of, switchMap, tap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { FigureIdea } from 'types/chart';
import { Response } from 'types/response';
import * as Highcharts from 'highcharts/highstock';
import { ConsolidationZonesShape, ConsolidationZonesState } from 'types/consolidation-zones';
import { AnnotationShapePointOptions, AnnotationsShapesOptions } from 'highcharts';
import { getJoinUniq } from 'utils/get-join-uniq';
import { StockTransaction } from 'types/stock';

export class FiguresStore extends WithQueue<ConsolidationZonesState> {
  private readonly _commonAxisValues = { xAxis: 0, yAxis: 0 };
  private readonly _from: Date = new Date(new Date(2014, 0, 1, 12).setUTCHours(0, 0, 0, 0));
  private readonly _to: Date = new Date(new Date().setUTCHours(23, 59, 59, 0));

  readonly zones$: Observable<ConsolidationZonesShape | null> = this.select(
    (state: ConsolidationZonesState) => state.zones
  );

  constructor(private readonly _api: DesktopService) {
    super({
      selected: null,
      zones: null,
    });
  }

  updateFigures = this.updater((state: ConsolidationZonesState, zones: any) => {
    return { ...state, zones };
  });

  readonly load = this.effect((stream$: Observable<StockTransaction | null>) => {
    return stream$.pipe(
      switchMap((id: StockTransaction | null) => this._getFigures(id)),
      // map((data: ConsolidationZones) => {
      //   return transformActiveConsolidationZones(data?.data);
      // }),
      tap((zones) => this.updateFigures(zones)),
      catchError((err: Error) => {
        console.error(err);
        return EMPTY;
      })
    );
  });

  private _getFigures(data: StockTransaction | null): Observable<any> {
    if (data === null || data.ideaId === null) {
      return of(null);
    }

    const key = getJoinUniq(data.ideaId, data.instrumentId);
    const value = this.queue.getValue(key);

    if (value) {
      return of(value);
    }

    return this._api.getChartFigures(data.ideaId, this._from.toISOString(), this._to.toISOString()).pipe(
      filter(
        (response: Response<FigureIdea | null> | null): response is Response<FigureIdea | null> => response !== null
      ),
      filter((response: Response<FigureIdea | null>): response is Response<FigureIdea> => response.data !== null),
      map((response: Response<FigureIdea>) => this._getResponseData(response.data)),
      map((response: Highcharts.AnnotationsOptions) => ({
        data: [response],
        instrument: data.instrumentId,
        parent: data.ideaId,
      })),
      tap((res: ConsolidationZonesShape) => this.queue.setValue(key, res))
    );
  }

  private _getResponseData(data: FigureIdea): Highcharts.AnnotationsOptions {
    const shapes: AnnotationsShapesOptions[] = [];
    const today = new Date().setUTCHours(12, 0, 0, 0);
    const endDate = new Date(today).setFullYear(new Date(today).getFullYear() + 5);

    let pointsPriceIn: Array<AnnotationShapePointOptions> = [];

    if (data.ideaParams.priceInPlan) {
      pointsPriceIn = [
        {
          x: new Date(data.ideaParams.priceInCandleDate || today).valueOf(),
          y: data.ideaParams.priceInPlan,
          ...this._commonAxisValues,
        },
        { x: endDate, y: data.ideaParams.priceInPlan, ...this._commonAxisValues },
      ];
    }

    if (data.ideaParams.entryPrice && data.ideaParams.entryDate) {
      pointsPriceIn = [
        { x: new Date(data.ideaParams.entryDate).valueOf(), y: data.ideaParams.entryPrice, ...this._commonAxisValues },
        { x: endDate, y: data.ideaParams.entryPrice, ...this._commonAxisValues },
      ];
    }

    shapes.push({
      type: 'path',
      fill: 'rgba(0,0,0,0)',
      stroke: 'rgba(64, 224, 208, 1)',
      strokeWidth: 1.5,
      ry: Math.PI,
      dashStyle: data.ideaParams.entryDate ? 'Solid' : 'Dash',
      points: pointsPriceIn,
    });

    if (data.ideaParams.stopCandleDate) {
      shapes.push({
        type: 'path',
        fill: 'rgba(0,0,0,0)',
        stroke: 'rgba(255,0,0,1)',
        strokeWidth: 2,
        dashStyle: 'Dash',
        ry: Math.PI,
        points: [
          {
            x: new Date(data.ideaParams.stopCandleDate || today).valueOf(),
            y: data.ideaParams.stop,
            ...this._commonAxisValues,
          },
          { x: endDate, y: data.ideaParams.stop, ...this._commonAxisValues },
        ],
      });
    }

    if (data.ideaParams.stopDate) {
      shapes.push({
        type: 'path',
        fill: 'rgba(0,0,0,0)',
        stroke: 'rgba(255,0,0,1)',
        strokeWidth: 1.5,
        dashStyle: 'Solid',
        ry: Math.PI,
        points: [
          { x: new Date(data.ideaParams.stopDate).valueOf(), y: data.ideaParams.stop, ...this._commonAxisValues },
          { x: endDate, y: data.ideaParams.stop, ...this._commonAxisValues },
        ],
      });
    }

    if (data.ideaParams.targets) {
      const currentDate = new Date().valueOf();

      const targets: AnnotationsShapesOptions[] = data.ideaParams.targets.map((item) => {
        const startDate = item.date !== null ? new Date(item.date).valueOf() : today;
        return {
          type: 'path',
          fill: 'rgba(0,0,0,0)',
          stroke: 'rgba(0, 255, 0, 1)',
          strokeWidth: 1.5,
          ry: Math.PI,
          dashStyle: item.date ? 'Solid' : 'Dash',
          points: [
            { x: startDate, y: item.value, ...this._commonAxisValues },
            { x: endDate, y: item.value, ...this._commonAxisValues },
          ],
        };
      });

      shapes.push(...targets);
    }

    return {
      shapes: shapes,
      draggable: '',
      zIndex: 20,
      id: `lines`,
    };
  }
}
