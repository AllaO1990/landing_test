import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponsePositions } from 'types/position';
import { Response } from 'types/response';
import { APP_CONFIG } from 'tokens/desktop/config';

@Injectable()
export class ApiDealService {
  #http: HttpClient = inject(HttpClient);
  readonly #config = inject(APP_CONFIG);

  get host() {
    return this.#config.host;
  }

  getPositionList(params: Params): Observable<Response<ResponsePositions>> {
    return this.#http.post<Response<ResponsePositions>>(`${this.host}/v1/ideas/positions`, { ...params });
  }
}
