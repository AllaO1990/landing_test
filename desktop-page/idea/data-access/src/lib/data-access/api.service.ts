import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponsePositions } from 'types/position';
import { Response } from 'types/response';
import { APP_CONFIG } from 'tokens/desktop/config';

@Injectable()
export class ApiIdeaService {
  #http: HttpClient = inject(HttpClient);
  readonly #config = inject(APP_CONFIG);

  get host() {
    return this.#config.host;
  }

  public getIdeaList(params: Params): Observable<Response<ResponsePositions>> {
    return this.#http.post<Response<ResponsePositions>>(`${this.host}/v1/ideas`, {
      currencyId: params['currencyId'] || null,
      instrumentType: params['instrumentType'] || null,
      limit: params['limit'] || null,
      page: params['page'] || null,
      query: params['query'] || null,
      strategyId: params['strategyId'] || null,
    });
  }
}
