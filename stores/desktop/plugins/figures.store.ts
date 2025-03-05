import { WithQueue } from '../core/with-queue.abstract';
import { DesktopService } from '@desktop-data/desktop-data';
import { catchError, EMPTY, Observable, of, switchMap, tap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Action, FigureIdea } from 'types/chart';
import { Response } from 'types/response';
import * as Highcharts from 'highcharts/highstock';
import { ConsolidationZonesShape, ConsolidationZonesState } from 'types/consolidation-zones';
import { AnnotationShapePointOptions, AnnotationsShapesOptions } from 'highcharts';
import { StockTransaction } from 'types/stock';

type FigureState = ConsolidationZonesState & { zonesUser: null | ConsolidationZonesShape };

let FIGURE_ID = 0;

export class FiguresStore extends WithQueue<FigureState> {
  private readonly _commonAxisValues = { xAxis: 0, yAxis: 0 };
  private readonly _from: Date = new Date(new Date(2014, 0, 1, 12).setUTCHours(0, 0, 0, 0));
  private readonly _to: Date = new Date(new Date().setUTCHours(23, 59, 59, 0));

  readonly zones$: Observable<ConsolidationZonesShape | null> = this.select((state: FigureState) => state.zones);

  readonly zonesUser$: Observable<ConsolidationZonesShape | null> = this.select(
    (state: FigureState) => state.zonesUser
  );

  constructor(private readonly _api: DesktopService) {
    super({
      selected: null,
      zones: null,
      zonesUser: null,
    });
  }

  updateFigures = this.updater((state: FigureState, zones: ConsolidationZonesShape | null) => {
    return { ...state, zones };
  });

  updateFiguresUser = this.updater((state: FigureState, zonesUser: ConsolidationZonesShape | null) => {
    return { ...state, zonesUser };
  });

  readonly load = this.effect((stream$: Observable<StockTransaction | null>) => {
    return stream$.pipe(
      switchMap((id: StockTransaction | null) => this._getFigures(id)),
      tap((response: ConsolidationZonesShape | null) => {
        if (response === null) {
          this.updateFigures(null);
          this.updateFiguresUser(null);

          return;
        }

        const [bot, user] = response.data;

        this.updateFigures({
          ...response,
          data: [bot],
        });

        this.updateFiguresUser({
          ...response,
          data: [user],
        });
      }),
      catchError((err: Error) => {
        console.error(err);
        return EMPTY;
      })
    );
  });

  private _getFigures(data: StockTransaction | null): Observable<ConsolidationZonesShape | null> {
    if (data === null || data.ideaId === null) {
      return of(null);
    }

    // const key = getJoinUniq(data.ideaId, data.instrumentId);
    // const value = this.queue.getValue(key);
    //
    // if (value) {
    //   return of(value);
    // }

    return this._api.getChartFigures(data.ideaId, this._from.toISOString(), this._to.toISOString()).pipe(
      filter(
        (response: Response<FigureIdea | null> | null): response is Response<FigureIdea | null> => response !== null
      ),
      filter((response: Response<FigureIdea | null>): response is Response<FigureIdea> => response.data !== null),
      map((response: Response<FigureIdea>) => this._getResponseData(response.data)),
      map((response: Highcharts.AnnotationsOptions[]) => ({
        data: response,
        instrument: data.instrumentId,
        parent: data.ideaId,
      }))
      // tap((data: ConsolidationZonesShape) => this.queue.setValue(key, data))
    );
  }

  private _getResponseData(data: FigureIdea): Highcharts.AnnotationsOptions[] {
    const shapes: AnnotationsShapesOptions[] = [];
    const today = new Date().setUTCHours(12, 0, 0, 0);
    const endDate = new Date(today).setFullYear(new Date(today).getFullYear() + 5);

    const shapesUser: AnnotationsShapesOptions[] = data.ideaParams.actions.map((item: Action) => {
      return {
        type: 'path',
        fill: 'rgba(0,0,0,0)',
        stroke: item.type === 'out' ? 'rgba(0, 255, 0, 1)' : 'rgba(64, 224, 208, 1)',
        strokeWidth: 1.5,
        ry: Math.PI,
        dashStyle: 'Solid',
        points: [
          { x: new Date(item.date).setUTCHours(0, 0, 0, 0), y: item.price, ...this._commonAxisValues },
          { x: endDate, y: item.price, ...this._commonAxisValues },
        ],
      };
    });

    let pointsPriceIn: Array<AnnotationShapePointOptions> = [];

    if (data.ideaParams.priceInPlan) {
      pointsPriceIn = [
        {
          x: new Date(data.ideaParams.priceInCandleDate || today).setUTCHours(0, 0, 0, 0),
          y: data.ideaParams.priceInPlan,
          ...this._commonAxisValues,
        },
        { x: endDate, y: data.ideaParams.priceInPlan, ...this._commonAxisValues },
      ];
    }

    if (data.ideaParams.entryPrice && data.ideaParams.entryDate) {
      pointsPriceIn = [
        {
          x: new Date(data.ideaParams.entryDate).setUTCHours(0, 0, 0, 0),
          y: data.ideaParams.entryPrice,
          ...this._commonAxisValues,
        },
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

    shapesUser.push({
      type: 'path',
      fill: 'rgba(0,0,0,0)',
      stroke: 'rgba(255,0,0,1)',
      strokeWidth: 2,
      dashStyle: 'Dash',
      ry: Math.PI,
      points: [
        {
          x: new Date(data.ideaParams.stopCandleDate || today).setUTCHours(0, 0, 0, 0),
          y: data.ideaParams.stop,
          ...this._commonAxisValues,
        },
        { x: endDate, y: data.ideaParams.stop, ...this._commonAxisValues },
      ],
    });

    if (data.ideaParams.targets) {
      const currentDate = new Date().valueOf();

      const targets: AnnotationsShapesOptions[] = data.ideaParams.targets.map((item) => {
        const startDate = item.date !== null ? new Date(item.date).setUTCHours(0, 0, 0, 0) : today;
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

    const id = ++FIGURE_ID;

    return [
      {
        shapes: shapes,
        draggable: '',
        zIndex: 20,
        id: `lines-idea--${id}`,
      },
      {
        shapes: shapesUser,
        draggable: '',
        zIndex: 20,
        id: `lines-user--${id}`,
      },
    ];
  }
}
