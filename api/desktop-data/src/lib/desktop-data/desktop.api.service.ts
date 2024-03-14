import { inject, Injectable } from '@angular/core';
import { DesktopAbstractService } from './desktop.abstract.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class DesktopApiService extends DesktopAbstractService {
  private readonly _http: HttpClient = inject(HttpClient);
  public getIdeaList(): Observable<any[]> {
    return this._http.get<any[]>('/assets/mocks/idea-list.json');
  }

  public getStockList(): Observable<any[]> {
    return this._http.get<any[]>('/assets/mocks/stock-list.json');
  }

  getTradeList(): Observable<any[]> {
    return this._http.get<any[]>('/assets/mocks/trade-list.json');
  }
}
