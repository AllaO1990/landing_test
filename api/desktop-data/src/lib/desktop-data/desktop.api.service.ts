import { inject, Injectable } from '@angular/core';
import { DesktopService } from './desktop.abstract.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, timer } from 'rxjs';
import {
  Stock,
  StockDirection,
  StockId, StockList,
  StockListItem,
  StockGroup
} from 'types/stock';
import { Idea } from 'types/idea';
import { Response } from 'types/response';

@Injectable()
export class DesktopApiService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  public getIdeaList(): Observable<Idea[]> {
    const today: Date = new Date();
    const maxDay: number = new Date(
      // today.getFullYear(),
      // today.getMonth() + 1,
      // 0
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
            const start = `${today.getFullYear()}-${today.getMonth() + 1}-${genNumber(
              maxDay,
              1
            )}`;

            return {
              id: i,
              figi: `${i}`,
              date: {
                start,
                passed: Math.round((new Date().valueOf() - new Date(start).valueOf()) / (24 * 60 * 60 * 1000))
              },
              direction: i % 5 ? StockDirection.SELL : StockDirection.BUY,
              ticker: 'MOEX',
              cost,
              enter: {
                price: cost - enterDiff,
                cost: cost * 3
              },
              target: {
                price: cost * 1.2,
                percentage: 20
              },
              stop: {
                price: cost - enterDiff * 2,
                percentage: .4
              },
              deposit: {
                price: deposit,
                percentage: 2.4
              },
              luck: {
                percentage: luck * 10,
                value: luck
              },
              idea: idea > 5
            };
          })
        )
      )
    );

    // return this._http.get<any[]>('/assets/mocks/idea-list.json');
  }

  public getList(): Observable<any> {
    return this._http.get<any>('/assets/mocks/stock.json');
  }

  public getStockList(): Observable<Response<Stock>> {
    return this._http.get<Response<Stock>>(`http://localhost:3002/api/v1/instruments?sub=true`);
    // return this._http.get<Response<Stock>>('/assets/mocks/stock.json');
  }

  public getActiveStock(list: StockList): Observable<any> {
    return this._http.post<any>(
      `http://localhost:3002/api/v1/instruments/last-close-price/by-ids`,
      {
        ids: list.map((item: StockListItem) => item.id)
      }
    );
  }

  public getStock(id: StockId): Observable<StockListItem[]> {
    return this._http.get<StockListItem[]>(
      `/assets/mocks/stock-list-${id}.json`
    );
  }

  getTradeList(): Observable<any[]> {
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

            return {
              id: i,
              figi: `${i}`,
              date: `${today.getFullYear()}-${today.getMonth() + 1}-${genNumber(
                maxDay,
                1
              )}`,
              direction: i % 4 ? StockDirection.SELL : StockDirection.BUY,
              ticker: 'MOEX',
              cost,
              enter: cost - enterDiff,
              target1: cost + enterDiff,
              target2: cost + enterDiff * 3,
              out: {
                price: cost + enterDiff * 2,
                value: 1
              },
              stop: {
                price: cost - enterDiff * 2,
                percentage: 2
              },
              deposit: {
                value: deposit,
                percentage: 2
              },
              luck
            };
          })
        )
      )
    );

    // return this._http.get<StockNameItem[]>('/assets/mocks/trade-list.json');
  }
}
