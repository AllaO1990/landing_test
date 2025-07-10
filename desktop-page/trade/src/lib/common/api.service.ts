import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DESKTOP_ENVIRONMENT } from 'tokens/desktop';
import { Observable } from 'rxjs';
import { Response } from 'types/response';
import { TradeAccounts, TradeSources, TradeToken, TradeTokenSource } from './api.types';

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
      body: {
        sourceId: data.sourceId,
        tokenId: data.tokenId,
      },
    });
  }
}
