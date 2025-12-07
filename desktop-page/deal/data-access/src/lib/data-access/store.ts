import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { ApiDealService } from './api.service';
import { forkJoin, map, Observable, switchMap, tap, timer } from 'rxjs';
import { Params } from '@angular/router';
import { Response } from 'types/response';
import { ResponsePositions } from 'types/position';

export interface DataAccessDealState {
  isLoaded: boolean;
  isLoading: boolean;
  data: ResponsePositions | null;
}

@Injectable()
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
    (state: DataAccessDealState, data: null | ResponsePositions): DataAccessDealState => ({
      ...state,
      data,
      isLoaded: true,
      isLoading: true,
    })
  );

  readonly loadPositions = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      tap(() => this.updateUploaded(false)),
      switchMap((params: Params) =>
        forkJoin([this.api.getPositionList(params), timer(1000)]).pipe(
          map(([response]: [Response<ResponsePositions>, number]) => response && this.updateData(response.data))
        )
      )
    )
  );
}
