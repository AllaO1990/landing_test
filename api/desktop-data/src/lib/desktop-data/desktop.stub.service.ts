import { DesktopService } from './desktop.abstract.service';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Stock, StockId, StockListItem, StockName } from 'types/stock';
import { Idea } from 'types/idea';
import { Response } from 'types/response';

@Injectable()
export class DesktopStubService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  getIdeaList(): Observable<Idea[]> {
    return this._http.get<Idea[]>(`assets/mocks/list-idea.json`);
  }

  getStock(id: StockId): Observable<StockListItem[]> {
    return of([]);
  }

  getStockList(): Observable<Response<Stock>> {
    return of();
  }

  public getActiveStock(list: StockList): Observable<any> {
    return of();
  }

  getTradeList(): Observable<StockName[]> {
    return of([]);
  }

  getList(): Observable<unknown> {
    return of([]);
  }
}
