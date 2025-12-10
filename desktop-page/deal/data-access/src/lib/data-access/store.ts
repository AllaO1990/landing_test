import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { ApiDealService } from './api.service';
import { forkJoin, map, Observable, switchMap, tap, timer } from 'rxjs';
import { Params } from '@angular/router';
import { DataList, Response } from 'types/response';
import { PortfolioPosition } from 'types/portfolio';

export interface DataAccessDealState {
  isLoaded: boolean;
  isLoading: boolean;
  data: DataList<PortfolioPosition> | null;
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
        forkJoin([this.api.getPortfolio(params), timer(1000)]).pipe(
          map(
            ([response]: [Response<DataList<PortfolioPosition>>, number]) => response && this.updateData(response.data)
          )
        )
      )
    )
  );
}
