import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, timer } from 'rxjs';
import { Idea } from 'types/idea';
import { Response } from 'types/response';
import {
  Stock,
  StockDirection,
  StockId,
  StockList,
  StockListItem, StockListPrice, StockPrice
} from 'types/stock';
import { DesktopService } from './desktop.abstract.service';
import _default from 'chart.js/dist/core/core.interaction';
import index = _default.modes.index;

@Injectable()
export class DesktopApiService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  public getIdeaList(): Observable<Idea[]> {
    const today: Date = new Date();
    const maxDay: number = new Date().getDate();
    // today.getFullYear(),
    // today.getMonth() + 1,
    // 0
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
            const start = `${today.getFullYear()}-${
              today.getMonth() + 1
            }-${genNumber(maxDay, 1)}`;

            return {
              id: i,
              figi: `${i}`,
              date: {
                start,
                passed: Math.round(
                  (new Date().valueOf() - new Date(start).valueOf()) /
                    (24 * 60 * 60 * 1000)
                ),
              },
              direction: i % 5 ? StockDirection.SELL : StockDirection.BUY,
              ticker: 'MOEX',
              cost,
              enter: {
                price: cost - enterDiff,
                cost: cost * 3,
              },
              target: {
                price: cost * 1.2,
                percentage: 20,
              },
              stop: {
                price: cost - enterDiff * 2,
                percentage: 0.4,
              },
              deposit: {
                price: deposit,
                percentage: 2.4,
              },
              luck: {
                percentage: luck * 10,
                value: luck,
              },
              idea: idea > 5,
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
    return this._http.get<Response<Stock>>(
      `https://trade.gpn.dev/api/v1/instruments?sub=true`
    );
    // return this._http.get<Response<Stock>>('/assets/mocks/stock.json');
  }

  public getActiveStock(list: StockList): Observable<Response<StockPrice<StockListPrice>>> {
    return this._http.post<Response<StockPrice<StockListPrice>>>(
      `https://trade.gpn.dev/api/v1/instruments/last-close-price/by-ids`,
      {
        ids: list.map((item: StockListItem) => item.id),
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
              cost: {
                price: cost,
                cost: cost * 3,
              },
              enter: {
                price: cost - enterDiff,
                cost: (cost - enterDiff) * 3,
              },
              result: {
                price: enterDiff,
                percentage: 3,
              },
              target1: {
                price: cost + enterDiff,
                percentage: 1,
              },
              target2: {
                price: cost + enterDiff * 3,
                percentage: 3,
              },
              out: {
                price: cost + enterDiff * 2,
                value: 1,
              },
              stop: {
                price: cost - enterDiff * 2,
                percentage: 2,
              },
              deposit: {
                value: deposit,
                percentage: 2,
              },
              luck,
            };
          })
        )
      )
    );

    // return this._http.get<StockNameItem[]>('/assets/mocks/trade-list.json');
  }

  getCandles(selected: { source: any; index: number }): Observable<any> {
    // console.log(selected);
    const from: string = selected.index === 0 ? '2015-03-20T00:00:00Z' : '2024-04-23T00:00:00Z';

    return this._http.get<any>(`https://trade.gpn.dev/api/v1/candles`, {
      params: {
        id: selected?.source.value.id,
        interval: 5,
        from,
        to: '2024-04-23T00:00:00Z',
      },
    });
  }
}
