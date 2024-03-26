import { DesktopService } from './desktop.abstract.service';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { StockId, StockListItem, StockNameItem } from 'types/stock';
import { Idea } from 'types/idea';

@Injectable()
export class DesktopStubService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  getIdeaList(): Observable<Idea[]> {
    return this._http.get<Idea[]>(`assets/mocks/list-idea.json`);
  }

  getStock(id: StockId): Observable<StockListItem[]> {
    return of([]);
  }

  getStockList(): Observable<unknown> {
    return of();
  }

  getTradeList(): Observable<StockNameItem[]> {
    return of([]);
  }
}
