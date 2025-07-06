import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DESKTOP_ENVIRONMENT } from 'tokens/desktop';
import { Observable } from 'rxjs';
import { Response } from 'types/response';

@Injectable()
export class ApiService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _environment = inject(DESKTOP_ENVIRONMENT);

  get host() {
    return this._environment.host;
  }

  getSources(): Observable<Response<any>> {
    return this._http.get<Response<any>>(`${this.host}/api/v1/trades/sources`);
  }
}
