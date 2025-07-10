import { ComponentStore } from '@ngrx/component-store';
import { ApiService } from './api.service';
import { Observable, switchMap, tap } from 'rxjs';
import { Response } from 'types/response';
import { TradeSources, TradeToken, TradeTokenSource } from './api.types';

export interface TradeState {
  sources: TradeSources | null;
  token: TradeToken | null;
}

export class TradeStore extends ComponentStore<TradeState> {
  readonly source$: Observable<TradeSources | null> = this.select((state: TradeState) => state.sources);
  readonly token$: Observable<TradeToken | null> = this.select((state: TradeState) => state.token);

  constructor(private _api: ApiService) {
    super({
      sources: null,
      token: null,
    });
  }

  readonly updateSources = this.updater(
    (state: TradeState, sources: null | TradeSources): TradeState => ({
      ...state,
      sources,
    })
  );

  readonly updateToken = this.updater(
    (state: TradeState, token: null | TradeToken): TradeState => ({
      ...state,
      token,
    })
  );

  loadSources = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_: void) => this._api.getSources()),
      tap((response: Response<TradeSources>) => this.updateSources(response.data))
    )
  );

  loadToken = this.effect((stream$: Observable<number>) =>
    stream$.pipe(
      switchMap((sourceId: number) => this._api.getToken(sourceId)),
      tap((response: Response<TradeToken | null>) => this.updateToken(response.data))
    )
  );

  changeToken = this.effect((stream$: Observable<TradeTokenSource>) =>
    stream$.pipe(
      switchMap((token: TradeTokenSource) => this._api.changeToken(token)),
      tap((response: Response<TradeToken | null>) => this.updateToken(response.data))
    )
  );

  removeToken = this.effect((stream$: Observable<TradeToken>) =>
    stream$.pipe(
      switchMap((token: TradeToken) => this._api.removeToken(token)),
      tap((response: Response<TradeToken | null>) => response.success && this.updateToken(null))
    )
  );
}
