import { DesktopService } from '@desktop-data/desktop-data';
import { ConsolidationZonesShape, ConsolidationZonesState } from 'types/consolidation-zones';
import { forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { ActiveZone } from 'types/chart';
import { map } from 'rxjs/operators';
import { Response } from 'types/response';
import { getPointsActiveZone } from 'utils/transform-consolidation-zones';
import { MAP_COLOR_CONSOLIDATION } from 'types/color';
import { WithQueue } from '../core/with-queue.abstract';
import { getJoinUniq } from 'utils/get-join-uniq';

export class ConsolidationZonesIdeaStore extends WithQueue<ConsolidationZonesState> {
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

    const uniqKey = getJoinUniq(params.id, params.from, params.to, ...params.interval);
    const value = this.queue.getValue(uniqKey);

    if (value) {
      return of(value);
    }

    return forkJoin(
      params.interval.map((interval: number) => this._api.getConsolidationZones({ ...params, interval }))
    ).pipe(
      map((response: any) => this._getResponseData(response)),
      tap((value: ActiveZone[]) => this.queue.setValue(uniqKey, value))
    );
  }

  private _getResponseData(response: Response<ActiveZone[] | null>[]): any[] {
    return response
      .filter((item: Response<ActiveZone[] | null>): item is Response<ActiveZone[]> => item.data !== null)
      .map((item: Response<ActiveZone[]>) =>
        item.data.map((zone) => ({
          points: getPointsActiveZone(zone),
          color: this._colorConsolidation[zone.timeframe as 5 | 12 | 13],
          id: 'zones',
        }))
      )
      .flat();
  }
}
