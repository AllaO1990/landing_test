import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from 'tokens/desktop/config';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import { Response } from 'types/response';
import { AccountBalance, AccountBalanceHistory } from 'types/account';

@Injectable()
export class ApiPortfolioService {
  #http: HttpClient = inject(HttpClient);
  readonly #config = inject(APP_CONFIG);

  get host() {
    return this.#config.host;
  }

  getAccountBalance(params: Params): Observable<Response<AccountBalance>> {
    return this.#http.post<Response<AccountBalance>>(`${this.host}/v1/account/balance`, {
      brokerId: params['brokerId'] || null,
      currencyId: params['currencyId'] || null,
      from: params['from'] || null,
      instrumentType: params['instrumentType'] || null,
      leadToCurrency: params['leadToCurrency'] || null,
      portfolioId: params['portfolioId'] || null,
      strategyId: params['strategyId'] || null,
      to: params['to'] || null,
    });
  }

  getAccountBalanceHistory(params: Params): Observable<Response<AccountBalanceHistory>> {
    return this.#http.post<Response<AccountBalanceHistory>>(`${this.host}/v1/account/balance/history`, {
      brokerId: params['brokerId'] || null,
      currencyId: params['currencyId'] || null,
      from: params['from'] || null,
      instrumentType: params['instrumentType'] || null,
      leadToCurrency: params['leadToCurrency'] || null,
      portfolioId: params['portfolioId'] || null,
      strategyId: params['strategyId'] || null,
      to: params['to'] || null,
    });
  }
}
