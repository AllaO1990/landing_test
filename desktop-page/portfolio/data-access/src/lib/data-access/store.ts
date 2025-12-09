import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { forkJoin, map, Observable, switchMap, tap, timer } from 'rxjs';
import { Params } from '@angular/router';
import { Response } from 'types/response';
import { AccountBalance } from 'types/account';
import { ApiPortfolioService } from './api.service';

export interface DataAccessPortfolioState {
  isLoaded: boolean;
  isLoading: boolean;
  data: AccountBalance | null;
}

@Injectable()
export class DataAccessPortfolioStore extends ComponentStore<DataAccessPortfolioState> {
  static defaultState: DataAccessPortfolioState = {
    isLoaded: false,
    isLoading: false,
    data: null,
  };

  constructor(private api: ApiPortfolioService) {
    super(DataAccessPortfolioStore.defaultState);
  }

  readonly updateUploaded = this.updater(
    (state: DataAccessPortfolioState, isUnloaded: boolean): DataAccessPortfolioState => ({
      ...state,
      isLoading: isUnloaded,
    })
  );

  readonly updateData = this.updater(
    (state: DataAccessPortfolioState, data: null | AccountBalance): DataAccessPortfolioState => ({
      ...state,
      data,
      isLoaded: true,
      isLoading: true,
    })
  );

  readonly loadAccountBalance = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      tap(() => this.updateUploaded(false)),
      switchMap((params: Params) =>
        forkJoin([this.api.getAccountBalance(params), timer(1000)]).pipe(
          map(([response]: [Response<AccountBalance>, number]) => response && this.updateData(response.data))
        )
      )
    )
  );
}
