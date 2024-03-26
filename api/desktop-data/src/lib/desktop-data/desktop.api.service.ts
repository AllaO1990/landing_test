import { inject, Injectable } from '@angular/core';
import { DesktopService } from './desktop.abstract.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, timer } from 'rxjs';
import {
  StockDirection,
  StockId,
  StockListItem,
  StockNameItem,
} from 'types/stock';
import { Idea } from 'types/idea';

@Injectable()
export class DesktopApiService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);
  public getIdeaList(): Observable<Idea[]> {
    const today: Date = new Date();
    const maxDay: number = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const genNumber = (max: number, min: number): number => {
      return Math.floor(Math.random() * (max - min) + min);
    };

    return timer(2000).pipe(
      switchMap((_) =>
        of(
          Array.from({ length: 100 }, (_, i: number) => {
            const cost = genNumber(10000, 100);
            const enterDiff = genNumber(100, 10);
            const deposit = genNumber(100, 2);
            const luck = genNumber(10, 1);
            const idea = genNumber(10, 0);

            return {
              id: i,
              figi: `${i}`,
              date: `${today.getFullYear()}-${today.getMonth() + 1}-${genNumber(
                maxDay,
                1
              )}`,
              direction: StockDirection.BUY,
              ticker: 'MOEX',
              cost,
              enter: cost - enterDiff,
              stop: cost - enterDiff * 2,
              deposit,
              luck,
              idea: idea > 5,
            };
          })
        )
      )
    );

    // return this._http.get<any[]>('/assets/mocks/idea-list.json');
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
