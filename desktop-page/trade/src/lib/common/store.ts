import { ComponentStore } from '@ngrx/component-store';
import { ApiService } from './api.service';
import { catchError, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { Response } from 'types/response';
import {
  TradeAccounts,
  TradeDirections,
  TradeOperations,
  TradeOrders,
  TradeOrderTypes,
  TradePortfolio,
  TradeSources,
  TradeToken,
  TradeTokenSource,
} from './api.types';
import { Params } from '@angular/router';

export interface TradeState {
  sources: TradeSources | null;
  token: Response<TradeToken | null> | null;
  accounts: Response<TradeAccounts | null> | null;
  orderType: TradeOrderTypes | null;
  orders: TradeOrders | null;
  portfolio: TradePortfolio | null;
  operations: TradeOperations | null;
  directionTypes: TradeDirections | null;
}

export class TradeStore extends ComponentStore<TradeState> {
  readonly source$: Observable<TradeSources | null> = this.select((state: TradeState) => state.sources);
  readonly token$: Observable<Response<TradeToken | null> | null> = this.select((state: TradeState) => state.token);
  readonly accounts$: Observable<Response<TradeAccounts | null> | null> = this.select(
    (state: TradeState) => state.accounts
  );
  readonly directionTypes$: Observable<TradeDirections | null> = this.select(
    (state: TradeState) => state.directionTypes
  );
  readonly orderTypes$: Observable<TradeOrderTypes | null> = this.select((state: TradeState) => state.orderType);
  readonly orders$: Observable<TradeOrders | null> = this.select((state: TradeState) => state.orders);
  readonly portfolio$: Observable<TradePortfolio | null> = this.select((state: TradeState) => state.portfolio);
  readonly operations$: Observable<TradeOperations | null> = this.select((state: TradeState) => state.operations);

  constructor(private _api: ApiService) {
    super({
      sources: null,
      token: null,
      accounts: null,
      orderType: null,
      orders: null,
      portfolio: null,
      operations: null,
      directionTypes: [
        { id: true, name: 'Купить' },
        { id: false, name: 'Продать' },
      ],
    });
  }

  readonly updateSources = this.updater(
    (state: TradeState, sources: null | TradeSources): TradeState => ({
      ...state,
      sources,
    })
  );

  readonly updateToken = this.updater(
    (state: TradeState, token: Response<TradeToken | null> | null): TradeState => ({
      ...state,
      token,
    })
  );

  readonly updateAccounts = this.updater(
    (state: TradeState, accounts: Response<TradeAccounts | null> | null): TradeState => ({
      ...state,
      accounts,
    })
  );

  readonly updateOrderTypes = this.updater(
    (state: TradeState, orderType: null | TradeOrderTypes): TradeState => ({
      ...state,
      orderType,
    })
  );

  readonly updateOrders = this.updater(
    (state: TradeState, orders: null | TradeOrders): TradeState => ({
      ...state,
      orders,
    })
  );

  readonly updateOperations = this.updater(
    (state: TradeState, operations: null | TradeOperations): TradeState => ({
      ...state,
      operations,
    })
  );

  readonly updatePortfolio = this.updater(
    (state: TradeState, portfolio: null | TradePortfolio): TradeState => ({
      ...state,
      portfolio,
    })
  );

  loadSources = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap(() => this._api.getSources()),
      tap((response: Response<TradeSources>) => this.updateSources(response.data))
    )
  );

  loadToken = this.effect((stream$: Observable<number>) =>
    stream$.pipe(
      switchMap((sourceId: number) => this._api.getToken(sourceId)),
      tap((response: Response<TradeToken | null>) => this.updateToken(response))
    )
  );

  changeToken = this.effect((stream$: Observable<TradeTokenSource>) =>
    stream$.pipe(
      switchMap((token: TradeTokenSource) => this._api.changeToken(token)),
      tap((response: Response<TradeToken | null>) => this.updateToken(response))
    )
  );

  removeToken = this.effect((stream$: Observable<TradeToken>) =>
    stream$.pipe(
      switchMap((token: TradeToken) => this._api.removeToken(token)),
      tap((response: Response<TradeToken | null>) => response.success && this.updateToken(null))
    )
  );

  loadAccounts = this.effect((stream$: Observable<number>) =>
    stream$.pipe(
      switchMap((sourceId: number) =>
        this._api.getAccounts(sourceId).pipe(
          catchError((error) =>
            of({
              data: null,
              ...error.error,
            })
          )
        )
      ),
      tap((response: Response<TradeAccounts | null>) => this.updateAccounts(response))
    )
  );

  loadOrderTypes = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap(() => this._api.getOrderTypes()),
      tap((response: Response<TradeOrderTypes>) => this.updateOrderTypes(response.data))
    )
  );

  loadOperations = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) => this._api.getOperations(params)),
      catchError((error) => {
        let response: Response<null | TradeOperations> = {
          data: null,
          message: error.message,
          success: false,
        };

        if (error.status === 500) {
          response = {
            ...response,
            data: [],
            success: true,
          };
        }

        return of(response);
      }),
      tap((response: Response<TradeOperations | null>) => response.success && this.updateOperations(response.data))
    )
  );

  loadPortfolio = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) => this._api.getPortfolio(params)),
      tap((response: Response<TradePortfolio | null>) => response.success && this.updatePortfolio(response.data))
    )
  );

  loadOrders = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) => this._api.getOrders(params)),
      tap((response: Response<TradeOrders | null>) => response.success && this.updateOrders(response.data))
    )
  );

  addOrder = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api.addOrder(params).pipe(tap((response: Response<any>) => response.success && this.loadOrders(params)))
      )
    )
  );

  addOrders = this.effect((stream$: Observable<Params[]>) =>
    stream$.pipe(
      switchMap((params: Params[]) =>
        forkJoin(params.map((item: Params) => this._api.addOrder(item))).pipe(tap(() => this.loadOrders(params)))
      )
    )
  );

  removeOrder = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api
          .removeOrder(params)
          .pipe(tap((response: Response<any>) => response.success && this.loadOrders(params)))
      )
    )
  );

  changeOrder = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api
          .removeOrder(params)
          .pipe(
            switchMap((removed: Response<any>) =>
              this._api
                .addOrder(params)
                .pipe(tap((response: Response<any>) => response.success && this.loadOrders(params)))
            )
          )
      )
    )
  );
}
