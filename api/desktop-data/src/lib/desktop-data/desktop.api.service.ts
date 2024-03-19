import { inject, Injectable } from '@angular/core';
import { DesktopAbstractService } from './desktop.abstract.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  StockId,
  StockListItem,
  StockNameItem,
} from '../../../../../apps/desktop/src/app/pages/main-v2/common/stock/stock.types';

@Injectable()
export class DesktopApiService extends DesktopAbstractService {
  private readonly _http: HttpClient = inject(HttpClient);
  public getIdeaList(): Observable<any[]> {
    return this._http.get<any[]>('/assets/mocks/idea-list.json');
  }

  public getStockList(): Observable<any[]> {
    return this._http.get<any[]>('/assets/mocks/stock-list.json');
  }

  public getStock(id: StockId): Observable<StockListItem[]> {
    return this._http.get<StockListItem[]>(
      `/assets/mocks/stock-list-${id}.json`
    );
  }

  getTradeList(): Observable<StockNameItem[]> {
    return this._http.get<StockNameItem[]>('/assets/mocks/trade-list.json');
  }
}
