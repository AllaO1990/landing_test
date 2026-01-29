import { ComponentStore } from '@ngrx/component-store';
import { catchError, forkJoin, map, Observable, of, switchMap, tap, timer } from 'rxjs';
import { Response } from 'types/response';
import { TradeLimit } from '@data-access-trade/types';
import { Params } from '@angular/router';

interface LimitApi {
	getLimitForCurrency(params: number): Observable<Response<TradeLimit>>;
	changeLimitForCurrency(params: Params): Observable<Response<TradeLimit>>;
	deleteLimitForCurrency(currencyId: number): Observable<Response<TradeLimit>>;
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
				forkJoin([
					this.api.getLimitForCurrency(params).pipe(
						catchError((err: Error) => {
							return of({
								data: null,
								message: err.message,
								success: true,
							});
						})
					),
					timer(1000),
				]).pipe(map(([response]: [Response<TradeLimit | null>, number]) => response && this.updateLimitData(response.data)))
			)
		)
	);

	readonly changeLimit = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			tap(() => this.updateLimitLoading(false)),
			switchMap((params: Params) =>
				forkJoin([
					this.api.changeLimitForCurrency(params).pipe(
						catchError((err: Error) => {
							this.loadLimit(params['currencyId']);

							return of({
								data: null,
								message: err.message,
								success: true,
							});
						})
					),
					timer(1000),
				]).pipe(map(([response]: [Response<TradeLimit | null>, number]) => response && this.updateLimitData(response.data)))
			)
		)
	);

	readonly deleteLimit = this.effect((stream$: Observable<number>) =>
		stream$.pipe(
			tap(() => this.updateLimitLoading(false)),
			switchMap((params: number) =>
				forkJoin([
					this.api.deleteLimitForCurrency(params).pipe(
						catchError((err: Error) => {
							this.loadLimit(params);

							return of({
								data: null,
								message: err.message,
								success: true,
							});
						})
					),
					timer(1000),
				]).pipe(tap(() => this.loadLimit(params)))
			)
		)
	);
}
