import { ComponentStore } from '@ngrx/component-store';
import { ApiDealService } from './api.service';
import { Observable, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';
import { DataList, Response } from 'types/response';
import { PortfolioPosition } from 'types/portfolio';
import { forkJoinTimer } from 'utils/forkjoin-timer';

export interface DataAccessDealState {
	isLoaded: boolean;
	isLoading: boolean;
	data: DataList<PortfolioPosition> | null;
}

export class DataAccessDealStore extends ComponentStore<DataAccessDealState> {
	static defaultState: DataAccessDealState = {
		isLoaded: false,
		isLoading: false,
		data: null,
	};

	constructor(private api: ApiDealService) {
		super(DataAccessDealStore.defaultState);
	}

	readonly updateUploaded = this.updater(
		(state: DataAccessDealState, isUnloaded: boolean): DataAccessDealState => ({
			...state,
			isLoading: isUnloaded,
		})
	);

	readonly updateData = this.updater(
		(state: DataAccessDealState, data: null | DataList<PortfolioPosition>): DataAccessDealState => ({
			...state,
			data,
			isLoaded: true,
			isLoading: true,
		})
	);

	readonly load = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			tap(() => this.updateUploaded(false)),
			switchMap((params: Params) =>
				forkJoinTimer(this.api.getPortfolio(params)).pipe(
					tap((response: Response<DataList<PortfolioPosition>>) => response && this.updateData(response.data))
				)
			)
		)
	);
}
