import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Response } from 'types/response';
import { Params } from '@angular/router';
import {
  TradeAccounts,
  TradeLimit,
  TradeLimitList,
  TradeOperations,
  TradeOrders,
  TradeOrderTypes,
  TradePortfolio,
  TradeSources,
  TradeToken,
  TradeTokenSource,
} from './api.types';
import { APP_CONFIG } from 'tokens/desktop/config';

@Injectable()
export class ApiService {
  readonly #config = inject(APP_CONFIG);
  private readonly _http: HttpClient = inject(HttpClient);

  get host() {
    return this.#config.host;
  }

  getSources(): Observable<Response<TradeSources>> {
    return this._http.get<Response<TradeSources>>(`${this.host}/v1/trades/sources`);
  }

  getAccounts(sourceId: number): Observable<Response<TradeAccounts>> {
    return this._http.get<Response<TradeAccounts>>(`${this.host}/v1/trades/accounts`, { params: { sourceId } });
  }

  getToken(sourceId: number): Observable<Response<TradeToken | null>> {
    return this._http.get<Response<TradeToken | null>>(`${this.host}/v1/trades/token`, { params: { sourceId } });
  }

  changeToken(data: TradeTokenSource): Observable<Response<TradeToken | null>> {
    return this._http.post<Response<TradeToken | null>>(`${this.host}/v1/trades/token`, data);
  }

  removeToken(data: TradeToken): Observable<Response<TradeToken | null>> {
    return this._http.delete<Response<TradeToken | null>>(`${this.host}/v1/trades/token`, {
      body: { sourceId: data.sourceId, tokenId: data.tokenId },
    });
  }

  getLimitForCurrency(currencyId: number): Observable<Response<TradeLimit>> {
    return this._http.get<Response<TradeLimit>>(`${this.host}/v1/trades/limit`, { params: { currencyId } });
  }

  getLimitList(): Observable<Response<TradeLimitList>> {
    return this._http.get<Response<TradeLimitList>>(`${this.host}/v1/trades/limit/list`);
  }

  getOperations(params: Params): Observable<Response<TradeOperations>> {
    return this._http.get<Response<TradeOperations>>(`${this.host}/v1/trades/operations`, { params });
  }

  getOrderTypes(): Observable<Response<TradeOrderTypes>> {
    return this._http.get<Response<TradeOrderTypes>>(`${this.host}/v1/trades/order-types`);
  }

  getPortfolio(params: Params): Observable<Response<TradePortfolio>> {
    return this._http.get<Response<TradePortfolio>>(`${this.host}/v1/trades/portfolio`, {
      params: {
        accountId: params['accountId'],
        instrumentId: params['instrumentId'],
        sourceId: params['sourceId'],
      },
    });
  }

  getOrders(params: Params): Observable<Response<TradeOrders>> {
    return this._http.get<Response<TradeOrders>>(`${this.host}/v1/trades/orders`, {
      params: {
        accountId: params['accountId'],
        instrumentId: params['instrumentId'],
        sourceId: params['sourceId'],
      },
    });
  }

  getStopOrders(params: Params): Observable<Response<TradeOrders | null>> {
    return this._http.get<Response<TradeOrders>>(`${this.host}/v1/trades/stop-orders`, {
      params: {
        accountId: params['accountId'],
        instrumentId: params['instrumentId'],
        sourceId: params['sourceId'],
      },
    });
  }

  addOrder(body: Params): Observable<Response<TradeOrders>> {
    return this._http.post<Response<TradeOrders>>(`${this.host}/v1/trades/orders`, {
      accountId: body['accountId'],
      direction: body['direction'],
      instrumentId: body['instrumentId'],
      orderType: body['orderType']['id'],
      price: body['price'],
      quantity: body['quantity'],
      sourceId: body['sourceId'],
    });
  }

  addStopOrder(body: Params): Observable<Response<any>> {
    return this._http
      .post<Response<TradeOrders>>(`${this.host}/v1/trades/stop-orders`, {
        accountId: body['accountId'],
        direction: body['direction'],
        exchangeOrderType: 0,
        expirationType: body['expirationType']['id'],
        expireDate: body['expireDate'],
        instrumentId: body['instrumentId'],
        price: body['price'],
        quantity: body['quantity'],
        sourceId: body['sourceId'],
        priceType: 0,
        stopOrderType: body['orderType']['id'],
        stopPrice: body['stopPrice'],
        takeProfitType: 0,
        trailingData: body['trailingData'],
      })
      .pipe(
        catchError((error: Error) => {
          console.warn(error);

          return of({
            data: null,
            message: error.message,
            success: false,
          });
        })
      );
  }

  removeOrder(body: Params): Observable<Response<any>> {
    return this._http
      .delete<Response<any>>(`${this.host}/v1/trades/orders`, {
        body: {
          accountId: body['accountId'],
          orderId: body['id'],
          sourceId: body['sourceId'],
        },
      })
      .pipe(
        catchError((error: Error) => {
          console.warn(error);

          return of({
            data: null,
            message: error.message,
            success: false,
          });
        })
      );
  }

  removeStopOrder(body: Params): Observable<Response<any>> {
    return this._http
      .delete<Response<any>>(`${this.host}/v1/trades/stop-orders`, {
        body: {
          accountId: body['accountId'],
          orderId: body['id'],
          sourceId: body['sourceId'],
        },
      })
      .pipe(
        catchError((error: Error) => {
          console.warn(error);

          return of({
            data: body,
            message: error.message,
            success: false,
          });
        })
      );
  }
}
