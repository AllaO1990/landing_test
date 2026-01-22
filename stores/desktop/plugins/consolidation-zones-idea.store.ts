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
import { StockTransaction } from 'types/stock';

export class ConsolidationZonesIdeaStore extends WithQueue<ConsolidationZonesState> {
	private _colorConsolidation = MAP_COLOR_CONSOLIDATION;

	readonly zones$: Observable<ConsolidationZonesShape | null> = this.select(
		(state: ConsolidationZonesState) => state.zones
	);

	constructor(private readonly _api: DesktopService) {
		super({
			selected: null,
			zones: null,
		});
	}

	updateZone = this.updater((state: ConsolidationZonesState, zones: ConsolidationZonesShape | null) => ({
		...state,
		zones,
	}));

	readonly load = this.effect((stream$: Observable<StockTransaction>) =>
		stream$.pipe(
			switchMap((params: StockTransaction) =>
				this._getConsolidationZones(params).pipe(tap((data) => this.updateZone(data)))
			)
		)
	);

	private _getConsolidationZones(params: StockTransaction | null): Observable<any> {
		if (params === null) {
			return of(null);
		}

		const { ideaId, instrumentId } = params;

		const uniqKey = getJoinUniq(ideaId, instrumentId);
		const value = this.queue.getValue(uniqKey);

		if (value) {
			return of(value);
		}

		return this._api.getIdeaConsolidationZone(ideaId).pipe(
			filter((response: Response<ActiveZone | null> | null): response is Response<ActiveZone | null> => response !== null),
			map((response: Response<ActiveZone | null>) => response.data && this._getResponseData(response.data)),
			tap((data: Highcharts.AnnotationsOptions | null) => !data && console.warn('ideas consolidation', ideaId, data)),
			map((data: Highcharts.AnnotationsOptions | null) => ({
				data: data ? [data] : [],
				instrument: instrumentId,
				parent: ideaId,
			})),
			tap((value: ConsolidationZonesShape) => this.queue.setValue(uniqKey, value))
		);
	}

	private _getResponseData(data: ActiveZone): Highcharts.AnnotationsOptions {
		const shapes: Highcharts.AnnotationsShapesOptions = {
			type: 'path',
			fill: 'rgba(0,0,0,0)',
			stroke: this._colorConsolidation[data.timeframe as 5 | 12 | 13],
			strokeWidth: 2,
			dashStyle: 'Dash',
			ry: Math.PI,
			points: getPointsActiveZone(data),
		};

		return {
			shapes: [shapes],
			draggable: '',
			zIndex: 10,
			id: `zones-idea`,
		};
	}
}
