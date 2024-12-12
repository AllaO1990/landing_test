import { DesktopService } from '@desktop-data/desktop-data';
import { ConsolidationZonesShape, ConsolidationZonesState } from 'types/consolidation-zones';
import { Observable, of, switchMap, tap } from 'rxjs';
import { ActiveZone } from 'types/chart';
import { filter, map } from 'rxjs/operators';
import { Response } from 'types/response';
import { getPointsActiveZone } from 'utils/transform-consolidation-zones';
import { MAP_COLOR_CONSOLIDATION } from 'types/color';
import { WithQueue } from '../core/with-queue.abstract';
import { getJoinUniq } from 'utils/get-join-uniq';
import * as Highcharts from 'highcharts/highstock';

export class ConsolidationZonesWatchlistStore extends WithQueue<ConsolidationZonesState> {
  private _colorConsolidation = MAP_COLOR_CONSOLIDATION;

  readonly selected$: Observable<number[] | null> = this.select((state: ConsolidationZonesState) => state.selected);

  readonly zones$: Observable<ConsolidationZonesShape | null> = this.select(
    (state: ConsolidationZonesState) => state.zones
  );

  constructor(private readonly _api: DesktopService) {
    super({
      selected: null,
      zones: null,
    });
  }

  updateSelected = this.updater((state: ConsolidationZonesState, selected: number[]) => ({ ...state, selected }));

  updateZone = this.updater((state: ConsolidationZonesState, zones: ConsolidationZonesShape | null) => ({
    ...state,
    zones,
  }));

  readonly load = this.effect((stream$: Observable<null | any>) =>
    stream$.pipe(
      switchMap((params: any | null) => this._getConsolidationZones(params).pipe(tap((data) => this.updateZone(data))))
    )
  );

  private _getConsolidationZones(params: any | null): Observable<any> {
    if (params === null) {
      return of(null);
    }

    const uniqKey = getJoinUniq(params.id);
    const value = this.queue.getValue(uniqKey);

    if (value) {
      return of(value);
    }

    return this._api.getWatchlistConsolidationZone(params.id).pipe(
      filter(
        (response: Response<ActiveZone | null> | null): response is Response<ActiveZone | null> => response !== null
      ),
      filter((response: Response<ActiveZone | null>): response is Response<ActiveZone> => response.data !== null),
      map((response: Response<ActiveZone>) => this._getResponseData(response.data)),
      map((data: Highcharts.AnnotationsOptions): ConsolidationZonesShape => ({ data: [data], instrument: params.id })),
      tap((value: ConsolidationZonesShape) => this.queue.setValue(uniqKey, value))
    );
  }

  private _getResponseData(data: ActiveZone): Highcharts.AnnotationsOptions {
    const shapes: Highcharts.AnnotationsShapesOptions = {
      type: 'path',
      fill: 'rgba(0,0,0,0)',
      stroke: this._colorConsolidation[data.timeframe as 5 | 12 | 13],
      strokeWidth: 3,
      dashStyle: 'Dash',
      ry: Math.PI,
      points: getPointsActiveZone(data),
    };

    return {
      shapes: [shapes],
      draggable: '',
      zIndex: 10,
      id: `zones-watch`,
    };
  }
}
