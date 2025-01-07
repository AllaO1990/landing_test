import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ActiveZone, FigureIdea } from 'types/chart';
import { Position, ResponsePosition, ResponsePositions } from 'types/position';
import { DataList, Response, ResponseMessage } from 'types/response';
import {
  Stock,
  StockId,
  StockInstrumentList,
  StockLinkListInstrument,
  StockLists,
  StockPrice,
  WithLastPrice,
} from 'types/stock';
import { DesktopService } from './desktop.abstract.service';
import { IndicatorEmaParams } from 'types/indicator-ema';
import { IndicatorSmaParams } from 'types/indicator-sma';
import { Timeframe } from 'types/timeframe';
import { Params } from '@angular/router';
import { AccountBroker, AccountCurrency, AccountPortfolio, AccountStrategies } from 'types/account';

@Injectable()
export class DesktopApiService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  public getIdeaList(): Observable<Position[]> {
    return this._http.get<Response<ResponsePositions>>(`https://trade.gpn.dev/api/v1/ideas`).pipe(
      filter((response: Response<ResponsePositions>) => response && response.message === ResponseMessage.success),
      map((response: Response<ResponsePositions>) => {
        if (response.data.items === null) {
          return [];
        }
        return response.data.items.map((item: ResponsePosition) => new Position(item));
      })
    );
  }

  public getChartFigures(ideaId: string, from: string, to: string): Observable<Response<FigureIdea | null> | null> {
    return this._http
      .get<Response<FigureIdea | null>>('https://trade.gpn.dev/api/v1/chart-figures', {
        params: { ideaId, from, to },
        // params: { ideaId, from: new Date(new Date().setFullYear(2014)).toISOString(), to: new Date().toISOString() },
      })
      .pipe(
        catchError((error: Error) => {
          console.log(error);
          return of(null);
        })
      );
  }

  public getStockList(): Observable<Response<Stock>> {
    return this._http.get<Response<Stock>>(`https://trade.gpn.dev/api/v1/instruments?sub=true`);
  }

  getInstrumentsLists(): Observable<Response<{ items: StockLists }>> {
    return this._http.get<Response<{ items: StockLists }>>(`https://trade.gpn.dev/api/v1/instruments-lists`);
  }

  getInstrumentsListItems(id: StockId): Observable<Response<Stock>> {
    return this._http.get<Response<any>>(`https://trade.gpn.dev/api/v1/instruments-list-items`, { params: { id } });
  }

  addInstrumentsListItems(value: StockLinkListInstrument): Observable<Response<StockLinkListInstrument>> {
    return this._http.post<Response<StockLinkListInstrument>>(
      `https://trade.gpn.dev/api/v1/instruments-list-items/add`,
      { ...value }
    );
  }

  deleteInstrumentsListsItems(value: StockLinkListInstrument): Observable<Response<StockLinkListInstrument>> {
    return this._http.delete<Response<StockLinkListInstrument>>(
      'https://trade.gpn.dev/api/v1/instruments-list-items/delete',
      {
        body: { ...value },
      }
    );
  }

  getWatchInstrumentsListItems(): Observable<Response<Stock>> {
    return this._http.get<Response<Stock>>(`https://trade.gpn.dev/api/v1/watch-instruments-list-items`);
  }

  createInstrumentsListItems(name: string): Observable<Response<StockInstrumentList>> {
    return this._http.post<Response<StockInstrumentList>>(`https://trade.gpn.dev/api/v1/instruments-lists/create`, {
      name,
    });
  }

  createDefaultInstrumentsListItems(): Observable<Response<{ items: StockLists }>> {
    return this._http.post<Response<{ items: StockLists }>>(
      `https://trade.gpn.dev/api/v1/instruments-lists/create-default`,
      {}
    );
  }

  deleteInstrumentsLists(id: string): Observable<Response<{ id: string }>> {
    return this._http.delete<
      Response<{
        id: string;
      }>
    >('https://trade.gpn.dev/api/v1/instruments-lists/delete', {
      body: { id },
    });
  }

  editInstrumentsListItems(value: StockInstrumentList): Observable<Response<StockInstrumentList>> {
    return this._http.patch<Response<StockInstrumentList>>(
      `https://trade.gpn.dev/api/v1/instruments-lists/edit`,
      value
    );
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
      map((response: Response<ResponsePositions>) => {
        if (response.data.items === null) {
          return [];
        }
        return response.data.items.map((item: ResponsePosition) => new Position(item));
      })
    );
  }

  getCandles(selected: { source: any; index: number }): Observable<any> {
    const lastYear = new Date().getFullYear();

    const from: string =
      selected.index === 0
        ? new Date(new Date(lastYear - 1, 0, 1, 23).setUTCHours(0, 0, 0, 0)).toISOString()
        : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    return this._http
      .get<Response<any>>(`https://trade.gpn.dev/api/v1/candles`, {
        params: {
          id: selected?.source,
          interval: Timeframe.CANDLE_INTERVAL_DAY,
          from,
          to: new Date(Date.now()).toISOString(),
        },
      })
      .pipe(
        filter((response: Response<any>) => response && response.message === ResponseMessage.success),
        map((response: Response<any>) => response.data)
      );
  }

  getIdeaConsolidationZone(id: StockId): Observable<Response<ActiveZone | null> | null> {
    return this._http
      .get<Response<ActiveZone | null> | null>(`https://trade.gpn.dev/api/v1/chart/idea-consolidation-zone`, {
        params: { ideaId: id },
      })
      .pipe(
        catchError((error: Error) => {
          console.log(error);
          return of(null);
        })
      );
  }

  getWatchlistConsolidationZone(id: StockId): Observable<Response<ActiveZone> | null> {
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

  getConsolidationZones(params: { id: string; interval: number; from: string; to: string }): Observable<Response<any>> {
    return this._http.get<Response<any>>('https://trade.gpn.dev/api/v1/chart/consolidation-zones', { params });
  }

  getAccountBrokers(params: Params): Observable<Response<DataList<AccountBroker>>> {
    return this._http.get<Response<DataList<AccountBroker>>>('https://trade.gpn.dev/api/v1/account/brokers', {
      params,
    });
  }

  getAccountCurrencies(params: Params): Observable<Response<DataList<AccountCurrency>>> {
    return this._http.get<Response<DataList<AccountCurrency>>>('https://trade.gpn.dev/api/v1/account/currencies', {
      params,
    });
  }

  getAccountPortfolios(params: Params): Observable<Response<DataList<AccountPortfolio>>> {
    return this._http.get<Response<DataList<AccountPortfolio>>>('https://trade.gpn.dev/api/v1/account/portfolios', {
      params,
    });
  }

  getAccountStrategies(): Observable<Response<DataList<AccountStrategies>>> {
    return this._http.get<Response<DataList<AccountStrategies>>>('https://trade.gpn.dev/api/v1/ideas/strategies');
  }

  createAccountPortfolio(portfolio: string): Observable<Response<AccountPortfolio>> {
    return this._http.post<Response<AccountPortfolio>>('https://trade.gpn.dev/api/v1/account/portfolio', {
      portfolio,
    });
  }

  editAccountPortfolio(portfolio: AccountPortfolio): Observable<Response<AccountPortfolio>> {
    return this._http.patch<Response<AccountPortfolio>>('https://trade.gpn.dev/api/v1/account/portfolio', {
      ...portfolio,
    });
  }

  deleteAccountPortfolio(portfolioId: number): Observable<Response<AccountPortfolio>> {
    return this._http.delete<Response<AccountPortfolio>>('https://trade.gpn.dev/api/v1/account/portfolio', {
      body: { portfolioId },
    });
  }
}
