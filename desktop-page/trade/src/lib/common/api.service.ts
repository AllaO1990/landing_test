import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DESKTOP_ENVIRONMENT } from 'tokens/desktop';
import { Observable } from 'rxjs';
import { Response } from 'types/response';
import {
  TradeAccounts,
  TradeOperation,
  TradeOrders,
  TradeOrderTypes,
  TradeSources,
  TradeToken,
  TradeTokenSource,
} from './api.types';
import { Params } from '@angular/router';

@Injectable()
export class ApiService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _environment = inject(DESKTOP_ENVIRONMENT);

  get host() {
    return this._environment.host;
  }

  getSources(): Observable<Response<TradeSources>> {
    return this._http.get<Response<TradeSources>>(`${this.host}/api/v1/trades/sources`);
  }

  getAccounts(sourceId: number): Observable<Response<TradeAccounts>> {
    return this._http.get<Response<TradeAccounts>>(`${this.host}/api/v1/trades/accounts`, { params: { sourceId } });
  }

  getToken(sourceId: number): Observable<Response<TradeToken | null>> {
    return this._http.get<Response<TradeToken | null>>(`${this.host}/api/v1/trades/token`, { params: { sourceId } });
  }

  changeToken(data: TradeTokenSource): Observable<Response<TradeToken | null>> {
    return this._http.post<Response<TradeToken | null>>(`${this.host}/api/v1/trades/token`, data);
  }

  removeToken(data: TradeToken): Observable<Response<any>> {
    return this._http.delete<Response<TradeToken | null>>(`${this.host}/api/v1/trades/token`, {
      body: { sourceId: data.sourceId, tokenId: data.tokenId },
    });
  }

  getOperations(params: Params): Observable<Response<TradeOperation>> {
    return this._http.get<Response<TradeOperation>>(`${this.host}/api/v1/trades/operations`, { params });
  }

  getOrderTypes(): Observable<Response<TradeOrderTypes>> {
    return this._http.get<Response<TradeOrderTypes>>(`${this.host}/api/v1/trades/order-types`);
  }

  getOrders(params: Params): Observable<Response<TradeOrders>> {
    return this._http.get<Response<TradeOrders>>(`${this.host}/api/v1/trades/orders`, { params });
  }

  setOrder(body: Params): Observable<Response<TradeOrders>> {
    return this._http.post<Response<TradeOrders>>(`${this.host}/api/v1/trades/orders`, body);
  }

  removeOrder(data: Params): Observable<Response<any>> {
    return this._http.delete<Response<any>>(`${this.host}/api/v1/trades/orders`, {
      body: {
        accountId: data['accountId'],
        orderId: data['orderId'],
        sourceId: data['sourceId'],
      },
    });
  }
}
