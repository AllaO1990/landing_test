import { ComponentStore } from '@ngrx/component-store';
import { forkJoin, map, Observable, switchMap, tap, timer } from 'rxjs';
import { Response } from 'types/response';
import { TradeLimit } from '@data-access-trade/types';

interface LimitApi {
	getLimitForCurrency(params: number): Observable<Response<TradeLimit>>;
}

export interface LimitState {
	isLoaded: boolean;
	isLoading: boolean;
	data: null | TradeLimit;
}

export class LimitStore extends ComponentStore<LimitState> {
	readonly limit$: Observable<TradeLimit | null> = this.select((state: LimitState) => state.data);
	readonly isLoaded$: Observable<boolean | null> = this.select((state: LimitState) => state.isLoaded);
	readonly isLoading$: Observable<boolean | null> = this.select((state: LimitState) => state.isLoading);

	constructor(private api: LimitApi) {
		super({
			isLoaded: false,
			isLoading: false,
			data: null,
		});
	}

	readonly updateLimitData = this.updater(
		(state: LimitState, data: null | TradeLimit): LimitState => ({
			...state,
			data,
			isLoaded: true,
			isLoading: true,
		})
	);

	readonly updateLimitLoading = this.updater(
		(state: LimitState, isLoading: boolean): LimitState => ({
			...state,
			isLoading,
		})
	);

	readonly loadLimit = this.effect((stream$: Observable<number>) =>
		stream$.pipe(
			tap(() => this.updateLimitLoading(false)),
			switchMap((params: number) =>
				forkJoin([this.api.getLimitForCurrency(params), timer(1000)]).pipe(
					map(([response]: [Response<TradeLimit>, number]) => response && this.updateLimitData(response.data))
				)
			)
		)
	);
}
