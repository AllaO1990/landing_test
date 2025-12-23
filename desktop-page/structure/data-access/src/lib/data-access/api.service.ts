import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import { Response } from 'types/response';
import { AccountStructure } from 'types/account';
import { APP_CONFIG } from 'tokens/desktop/config';

@Injectable()
export class ApiStructureService {
  #http: HttpClient = inject(HttpClient);
  readonly #config = inject(APP_CONFIG);

  get host() {
    return this.#config.host;
  }

  getAccountStructure(params: Params): Observable<Response<AccountStructure>> {
    return this.#http.post<Response<AccountStructure>>(`${this.host}/v1/account/portfolios/structure`, {
      brokerId: params['brokerId'] || null,
      currencyId: params['currencyId'] || null,
      portfolioId: params['portfolioId'] || null,
      leadToCurrency: params['leadToCurrency'] || null,
      strategyId: params['strategyId'] || null,
      date: params['date'] || null,
      groupBy: params['groupBy'] || null,
    });
  }
}
