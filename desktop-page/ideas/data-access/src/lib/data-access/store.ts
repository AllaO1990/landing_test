import { ComponentStore } from '@ngrx/component-store';
import { ApiIdeasService } from './api.service';
import { catchError, forkJoin, map, Observable, of, switchMap, tap, timer } from 'rxjs';
import { Params } from '@angular/router';
import { DataList, Response } from 'types/response';
import { Position, Positions, ResponsePositions } from 'types/position';
import { PortfolioPosition } from 'types/portfolio';
import { forkJoinTimer } from 'utils/forkjoin-timer';

export interface DataAccess<T> {
	isLoaded: boolean;
	isLoading: boolean;
	data: T | null;
}

export interface DataAccessIdeasState {
	ideas: DataAccess<Positions>;
	deals: DataAccess<DataList<PortfolioPosition>>;
}

export class DataAccessIdeasStore extends ComponentStore<DataAccessIdeasState> {
	static defaultState: DataAccessIdeasState = {
		ideas: { isLoaded: false, isLoading: false, data: null },
		deals: { isLoaded: false, isLoading: false, data: null },
	};

	readonly ideas$: Observable<DataAccess<Positions>> = this.select((state: DataAccessIdeasState) => state.ideas);
	readonly deals$: Observable<DataAccess<DataList<PortfolioPosition>>> = this.select(
		(state: DataAccessIdeasState) => state.deals
	);

	constructor(private api: ApiIdeasService) {
		super(DataAccessIdeasStore.defaultState);
	}

	readonly updateIdeasUploaded = this.updater(
		(state: DataAccessIdeasState, isUnloaded: boolean): DataAccessIdeasState => ({
			...state,
			ideas: {
				...state.ideas,
				isLoading: isUnloaded,
			},
		})
	);

	readonly updateIdeasData = this.updater(
		(state: DataAccessIdeasState, data: null | ResponsePositions): DataAccessIdeasState => {
			if (data) {
				return {
					...state,
					ideas: {
						data: {
							total: data.total,
							items: (data.items || []).map((item) => new Position(item)),
						},
						isLoaded: true,
						isLoading: true,
					},
				};
			}

			return {
				...state,
				ideas: {
					data: null,
					isLoaded: true,
					isLoading: true,
				},
			};
		}
	);

	readonly updateDealsUploaded = this.updater(
		(state: DataAccessIdeasState, isUnloaded: boolean): DataAccessIdeasState => ({
			...state,
			deals: {
				...state.deals,
				isLoading: isUnloaded,
			},
		})
	);

	readonly updateDealsData = this.updater(
		(state: DataAccessIdeasState, data: null | DataList<PortfolioPosition>): DataAccessIdeasState => ({
			...state,
			deals: {
				data,
				isLoaded: true,
				isLoading: true,
			},
		})
	);

	readonly loadIdeas = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			tap(() => this.updateIdeasUploaded(false)),
			switchMap((params: Params) =>
				forkJoin([
					this.api.getIdeaList(params).pipe(
						catchError((err: Error) => {
							console.error(err);

							return of({
								data: {
									items: null,
									total: 0,
								},
								message: `Error 'getIdeaList' ${err.message}`,
								success: false,
							});
						})
					),
					timer(1000),
				]).pipe(map(([response]: [Response<ResponsePositions>, number]) => response && this.updateIdeasData(response.data)))
			)
		)
	);

	readonly loadDeals = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			tap(() => this.updateDealsUploaded(false)),
			switchMap((params: Params) =>
				forkJoinTimer(this.api.getPortfolio(params)).pipe(
					tap((response: Response<DataList<PortfolioPosition>>) => response && this.updateDealsData(response.data))
				)
			)
		)
	);
}
