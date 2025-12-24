import { AccountStructure } from 'types/account';
import { ComponentStore } from '@ngrx/component-store';
import { forkJoin, map, Observable, switchMap, tap, timer } from 'rxjs';
import { Params } from '@angular/router';
import { Response } from 'types/response';
import { ApiStructureService } from './api.service';

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
        forkJoin([this.api.getAccountStructure(params), timer(1000)]).pipe(
          map(([response]: [Response<AccountStructure>, number]) => response && this.updateData(response.data))
        )
      )
    )
  );
}
