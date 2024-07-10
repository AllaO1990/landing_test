import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConsolidationZones } from 'types/chart';
import { Idea, ResponseIdea, ResponseListIdea } from 'types/idea';
import { Position, ResponsePosition, ResponsePositions } from 'types/position';
import { Response, ResponseMessage } from 'types/response';
import { Stock, StockId, StockInstrument, StockPrice, WithLastPrice } from 'types/stock';
import { getPriceIncrement } from 'utils/get-price-increment';
import { DesktopService } from './desktop.abstract.service';

@Injectable()
export class DesktopApiService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  public getIdeaList(): Observable<Idea[]> {
    return this._http.get<Response<ResponseListIdea>>(`https://trade.gpn.dev/api/v1/ideas`).pipe(
      filter((response: Response<ResponseListIdea>) => response && response.message === ResponseMessage.success),
      map((response: Response<ResponseListIdea>) =>
        response.data.items.map((item: ResponseIdea) => ({
          ...item,
          priceIncrement: getPriceIncrement(item.minPriceIncrement),
          targets: item.targets ? item.targets : [item.target],
        }))
      ),
      catchError((error: Error) => {
        console.error(error);
        return of([]);
      })
    );
  }

  public getList(): Observable<any> {
    return this._http.get<any>('/assets/mocks/stock.json');
  }

  public getConsolidationZones(ideaId: string): Observable<any> {
    return this._http.get<ConsolidationZones>('https://trade.gpn.dev/api/v1/chart-figures', {
      params: { ideaId, from: new Date(new Date().setFullYear(2014)).toISOString(), to: new Date().toISOString() },
    });
  }

  public getStockList(): Observable<Response<Stock>> {
    return this._http.get<Response<Stock>>(`https://trade.gpn.dev/api/v1/instruments?sub=true`);
    // return this._http.get<Response<Stock>>('/assets/mocks/stock.json');
  }

  public getActiveStock(list: StockId[]): Observable<StockPrice<WithLastPrice>> {
    return this._http
      .post<Response<StockPrice<WithLastPrice>>>(`https://trade.gpn.dev/api/v1/instruments/last-close-price/by-ids`, {
        ids: [...new Set(list)],
      })
      .pipe(
        filter(
          (response: Response<StockPrice<WithLastPrice>>) => response && response.message === ResponseMessage.success
        ),
        map((response: Response<StockPrice<WithLastPrice>>) => response.data)
      );
  }

  public getStock(id: StockId): Observable<StockInstrument[]> {
    return this._http.get<StockInstrument[]>(`/assets/mocks/stock-list-${id}.json`);
  }

  getPositionList(): Observable<Position[]> {
    return this._http.get<Response<ResponsePositions>>(`https://trade.gpn.dev/api/v1/ideas/positions`).pipe(
      filter((response: Response<ResponsePositions>) => response && response.message === ResponseMessage.success),
      map((response: Response<ResponsePositions>) =>
        response.data.items.map((item: ResponsePosition) => ({
          ...item,
          priceIncrement: getPriceIncrement(item.minPriceIncrement),
          profit:
            ((item.entry.price - item.lastPrice) / item.lastPrice) * 100 * (item.positionType === 'short' ? -1 : 1),
        }))
      )
    );

    // const today: Date = new Date();
    // const maxDay: number = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    // const genNumber = (max: number, min: number): number => {
    //   return Math.floor(Math.random() * (max - min) + min);
    // };
    //
    // return timer(2000).pipe(
    //   switchMap((_) =>
    //     of(
    //       Array.from({ length: 100 }, (_, i: number) => {
    //         const cost = genNumber(10000, 100);
    //         const enterDiff = genNumber(100, 10);
    //         const deposit = genNumber(100, 2);
    //         const luck = genNumber(10, 1);
    //         const start = `${today.getFullYear()}-${today.getMonth() + 1}-${genNumber(maxDay, 1)}`;
    //
    //         return {
    //           id: i,
    //           figi: `${i}`,
    //           date: {
    //             start,
    //             passed: Math.round((new Date().valueOf() - new Date(start).valueOf()) / (24 * 60 * 60 * 1000)),
    //           },
    //           direction: i % 4 ? StockDirection.SELL : StockDirection.BUY,
    //           ticker: 'SBER',
    //           name: 'Сбер Банк',
    //           exchange: 'MOEX',
    //           cost: {
    //             price: cost,
    //             cost: cost * 3,
    //           },
    //           enter: {
    //             price: cost - enterDiff,
    //             cost: (cost - enterDiff) * 3,
    //           },
    //           result: {
    //             price: enterDiff,
    //             percentage: 3,
    //           },
    //           target1: {
    //             price: cost + enterDiff,
    //             percentage: luck,
    //             count: enterDiff,
    //             countPercent: Number((luck * 1.1).toFixed(2)),
    //           },
    //           target2: {
    //             price: cost + enterDiff * 3,
    //             percentage: luck * 1.5,
    //             count: enterDiff,
    //             countPercent: luck * 2,
    //           },
    //           profit: {
    //             percentage: luck,
    //             count: cost,
    //           },
    //           out: {
    //             price: cost + enterDiff * 2,
    //             value: 1,
    //           },
    //           stop: {
    //             price: cost - enterDiff * 2,
    //             percentage: 2,
    //           },
    //           deposit: {
    //             value: deposit,
    //             percentage: 2,
    //           },
    //           luck,
    //         };
    //       })
    //     )
    //   )
    // );

    // return this._http.get<StockNameItem[]>('/assets/mocks/trade-list.json');
  }

  getCandles(selected: { source: any; index: number }): Observable<any> {
    // console.log(selected);
    const from: string =
      selected.index === 0
        ? new Date(new Date().setFullYear(2019)).toISOString()
        : new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    return this._http.get<any>(`https://trade.gpn.dev/api/v1/candles`, {
      params: {
        id: selected?.source.id,
        interval: 5,
        from,
        to: new Date(Date.now()).toISOString(),
      },
    });
  }
}
