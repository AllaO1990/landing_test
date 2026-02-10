import { AccountStructure } from 'types/account';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';
import { ApiStructureService } from './api.service';
import { forkJoinTimer } from 'utils/forkjoin-timer';
import { Response } from 'types/response';

export interface DataAccessStructureState {
	isLoaded: boolean;
	isLoading: boolean;
	data: AccountStructure | null;
}

export class DataAccessStructureStore extends ComponentStore<DataAccessStructureState> {
	static defaultState: DataAccessStructureState = {
		isLoaded: false,
		isLoading: false,
		data: null,
	};

	constructor(private api: ApiStructureService) {
		super(DataAccessStructureStore.defaultState);
	}

	readonly updateUploaded = this.updater(
		(state: DataAccessStructureState, isUnloaded: boolean): DataAccessStructureState => ({
			...state,
			isLoading: isUnloaded,
		})
	);

	readonly updateData = this.updater(
		(state: DataAccessStructureState, data: null | AccountStructure): DataAccessStructureState => ({
			...state,
			data,
			isLoaded: true,
			isLoading: true,
		})
	);

	readonly loadStructure = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			tap(() => this.updateUploaded(false)),
			switchMap((params: Params) =>
				forkJoinTimer(
					this.api.getAccountStructure(params).pipe(
						catchError((err: Error) => {
							console.error(err);

							return of({
								data: null,
								message: `Error 'getAccountStructure' ${err.message}`,
								success: false,
							});
						})
					)
				).pipe(map((response: Response<AccountStructure | null>) => response && this.updateData(response.data)))
			)
		)
	);
}
