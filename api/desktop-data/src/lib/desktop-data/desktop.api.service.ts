import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConsolidationZones } from 'types/chart';
import { Idea, ResponseIdea, ResponseListIdea } from 'types/idea';
import { Position, ResponsePosition, ResponsePositions } from 'types/position';
import { Response, ResponseMessage } from 'types/response';
import { Stock, StockId, StockPrice, WithLastPrice } from 'types/stock';
import { getPriceIncrement } from 'utils/get-price-increment';
import { DesktopService } from './desktop.abstract.service';
import { IndicatorEmaParams } from 'types/indicator-ema';
import { IndicatorSmaParams } from 'types/indicator-sma';
import { Timeframe } from 'types/timeframe';

@Injectable()
export class DesktopApiService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  public getIdeaList(): Observable<Idea[]> {
    return this._http.get<Response<ResponseListIdea>>(`https://trade.gpn.dev/api/v1/ideas`).pipe(
      filter((response: Response<ResponseListIdea>) => response && response.message === ResponseMessage.success),
      map((response: Response<ResponseListIdea>) =>
        (response.data.items || []).map((item: ResponseIdea) => ({
          ...item,
          priceIncrement: getPriceIncrement(item.minPriceIncrement),
        }))
      )
    );
  }

  public getList(): Observable<any> {
    return this._http.get<any>('/assets/mocks/stock.json');
  }

  public getConsolidationZones(ideaId: string): Observable<any> {
    return this._http
      .get<ConsolidationZones>('https://trade.gpn.dev/api/v1/chart-figures', {
        params: { ideaId, from: new Date(new Date().setFullYear(2014)).toISOString(), to: new Date().toISOString() },
      })
      .pipe(
        catchError((error: Error) => {
          console.log(error);
          return of({
            data: {
              activeZones: [],
              ideaParams: [],
            },
          });
        })
      );
  }

  public getStockList(): Observable<Response<Stock>> {
    return this._http.get<Response<Stock>>(`https://trade.gpn.dev/api/v1/instruments?sub=true`);
  }

  getInstrumentsLists(): Observable<Response<{ id: string; name: string }>> {
    return this._http.get<Response<{ id: string; name: string }>>(`https://trade.gpn.dev/api/v1/instruments-lists`);
  }

  getInstrumentsListItems(id: StockId): Observable<Response<Stock>> {
    return this._http.get<Response<any>>(`https://trade.gpn.dev/api/v1/instruments-list-items`, { params: { id } });
  }

  getWatchInstrumentsListItems(): Observable<Response<Stock>> {
    return this._http.get<Response<Stock>>(`https://trade.gpn.dev/api/v1/watch-instruments-list-items`);
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

  getPositionList(): Observable<Position[]> {
    return this._http.get<Response<ResponsePositions>>(`https://trade.gpn.dev/api/v1/ideas/positions`).pipe(
      filter((response: Response<ResponsePositions>) => response && response.message === ResponseMessage.success),
      map((response: Response<ResponsePositions>) =>
        response.data.items.map((item: ResponsePosition) => new Position(item))
      )
    );
  }

  getCandles(selected: { source: any; index: number }): Observable<any> {
    // console.log(selected);
    const lastYear = new Date().getFullYear();

    const from: string =
      selected.index === 0
        ? new Date(new Date(lastYear - 1, 0, 1, 3, 0, 0, 0)).toISOString()
        : new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    return this._http.get<any>(`https://trade.gpn.dev/api/v1/candles`, {
      params: {
        id: selected?.source.id,
        interval: Timeframe.CANDLE_INTERVAL_DAY,
        from,
        to: new Date(Date.now()).toISOString(),
      },
    });
  }

  getWatchlistConsolidationZone(id: StockId): Observable<any> {
    return this._http
      .get<any>(`https://trade.gpn.dev/api/v1/chart/watchlist-consolidation-zone`, { params: { id } })
      .pipe(
        catchError((error: Error) => {
          console.log(error);
          return of(null);
        })
      );
  }

  getIndicatorAtr(id: StockId, interval: number, date: string): Observable<Response<any>> {
    return this._http.get<Response<any>>('https://trade.gpn.dev/api/v1/chart/atr', { params: { id, interval, date } });
  }

  getIndicatorEma(params: IndicatorEmaParams): Observable<Response<any>> {
    return this._http.post<Response<any>>('https://trade.gpn.dev/api/v1/chart/ema', params);
  }

  getIndicatorSma(params: IndicatorSmaParams): Observable<Response<any>> {
    return this._http.post<Response<any>>('https://trade.gpn.dev/api/v1/chart/sma', params);
  }
}
