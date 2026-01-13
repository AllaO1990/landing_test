import { HttpClient } from '@angular/common/http';
import { AppConfig } from '../tokens/desktop/config';
import { ComponentStore } from '@ngrx/component-store';
import {
	debounceTime,
	distinctUntilChanged,
	forkJoin,
	map,
	Observable,
	shareReplay,
	switchMap,
	tap,
	timer,
} from 'rxjs';
import { Response } from '../types/response';

export interface PermissionsState {
	data: string[] | null;
	isLoaded: boolean;
	isLoading: boolean;
}

export class Permissions extends ComponentStore<PermissionsState> {
	readonly isAccessed$: Observable<boolean | null> = this.select((state: PermissionsState) => state.data).pipe(
		map((data: string[] | null) => isAccess(data)),
		distinctUntilChanged(),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	constructor(private readonly http: HttpClient, private readonly config: AppConfig) {
		super({ data: null, isLoaded: false, isLoading: false });
	}

	readonly updateLoading = this.updater((state: PermissionsState, isLoading: boolean) => ({
		...state,
		isLoading,
	}));

	readonly updateData = this.updater((state: PermissionsState, data: string[] | null) => ({
		...state,
		data,
		isLoaded: true,
		isLoading: false,
	}));

	readonly load = this.effect((stream$: Observable<void>) =>
		stream$.pipe(
			tap(() => this.updateLoading(true)),
			debounceTime(500),
			switchMap(() =>
				forkJoin([this.http.get<Response<string[]>>(`${this.config.host}/v1/auth/permissions`), timer(500)])
			),
			tap(([response]: [Response<string[]>, number]) => response && this.updateData(response.data))
		)
	);
}

const isAccess = (data: string[] | null): boolean | null => {
	if (data === null) {
		return null;
	}

	return data.includes('site.access');
};
