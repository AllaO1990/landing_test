import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { ApiIdeaService } from './api.service';
import { forkJoin, map, Observable, switchMap, tap, timer } from 'rxjs';
import { Params } from '@angular/router';
import { Response } from 'types/response';
import { ResponsePositions } from 'types/position';

export interface DataAccessIdeaState {
  isLoaded: boolean;
  isLoading: boolean;
  data: ResponsePositions | null;
}

@Injectable()
export class DataAccessIdeaStore extends ComponentStore<DataAccessIdeaState> {
  static defaultState: DataAccessIdeaState = {
    isLoaded: false,
    isLoading: false,
    data: null,
  };

  constructor(private api: ApiIdeaService) {
    super(DataAccessIdeaStore.defaultState);
  }

  readonly updateUploaded = this.updater(
    (state: DataAccessIdeaState, isUnloaded: boolean): DataAccessIdeaState => ({
      ...state,
      isLoading: isUnloaded,
    })
  );

  readonly updateData = this.updater(
    (state: DataAccessIdeaState, data: null | ResponsePositions): DataAccessIdeaState => ({
      ...state,
      data,
      isLoaded: true,
      isLoading: true,
    })
  );

  readonly loadIdaes = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      tap(() => this.updateUploaded(false)),
      switchMap((params: Params) =>
        forkJoin([this.api.getIdeaList(params), timer(1000)]).pipe(
          map(([response]: [Response<ResponsePositions>, number]) => response && this.updateData(response.data))
        )
      )
    )
  );
}
