import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ActiveZone, FigureIdea } from 'types/chart';
import { Position, ResponsePosition, ResponsePositions, StockPosition } from 'types/position';
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
import {
  AccountBalance,
  AccountBalanceHistory,
  AccountBroker,
  AccountCurrency,
  AccountDeposit,
  AccountPortfolio,
  AccountStrategies,
  AccountStructure,
  AccountTransactions,
} from 'types/account';
import { PortfolioPosition } from 'types/portfolio';
import { DESKTOP_ENVIRONMENT } from 'tokens/desktop';
import { Commission } from 'types/commission';

@Injectable()
export class DesktopApiService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _environment = inject(DESKTOP_ENVIRONMENT);

  get host() {
    return this._environment.host;
  }

  public getIdeaList(): Observable<Position[]> {
    return this._http.get<Response<ResponsePositions>>(`${this.host}/api/v1/ideas`).pipe(
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
      .get<Response<FigureIdea | null>>(`${this.host}/api/v1/chart-figures`, {
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

  public getStockList(queryParams: Params): Observable<Response<Stock>> {
    return this._http.get<Response<Stock>>(`${this.host}/api/v1/instruments`, { params: queryParams });
  }

  searchStockListInstrument(queryParams: Params): Observable<Response<Stock>> {
    return this._http.get<Response<Stock>>(`${this.host}/api/v1/instruments/search`, { params: queryParams });
  }

  addSubscriptionStockListInstrument(params: Params): Observable<Response<any>> {
    return this._http.post<Response<Stock>>(`${this.host}/api/v1/instruments/add-to-subscription`, {
      ...params,
    });
  }

  getInstrumentsLists(): Observable<Response<{ items: StockLists }>> {
    return this._http.get<Response<{ items: StockLists }>>(`${this.host}/api/v1/instruments-lists`);
  }

  getInstrumentsListItems(id: StockId): Observable<Response<Stock>> {
    return this._http.get<Response<any>>(`${this.host}/api/v1/instruments-list-items`, { params: { id } });
  }

  addInstrumentsListItems(value: StockLinkListInstrument): Observable<Response<StockLinkListInstrument>> {
    return this._http.post<Response<StockLinkListInstrument>>(`${this.host}/api/v1/instruments-list-items/add`, {
      ...value,
    });
  }

  deleteInstrumentsListsItems(value: StockLinkListInstrument): Observable<Response<StockLinkListInstrument>> {
    return this._http.delete<Response<StockLinkListInstrument>>(`${this.host}/api/v1/instruments-list-items/delete`, {
      body: { ...value },
    });
  }

  getWatchInstrumentsListItems(): Observable<Response<Stock>> {
    return this._http.get<Response<Stock>>(`${this.host}/api/v1/watch-instruments-list-items`);
  }

  createInstrumentsListItems(name: string): Observable<Response<StockInstrumentList>> {
    return this._http.post<Response<StockInstrumentList>>(`${this.host}/api/v1/instruments-lists/create`, {
      name,
    });
  }

  createDefaultInstrumentsListItems(): Observable<Response<{ items: StockLists }>> {
    return this._http.post<Response<{ items: StockLists }>>(`${this.host}/api/v1/instruments-lists/create-default`, {});
  }

  deleteInstrumentsLists(id: string): Observable<Response<{ id: string }>> {
    return this._http.delete<
      Response<{
        id: string;
      }>
    >(`${this.host}/api/v1/instruments-lists/delete`, {
      body: { id },
    });
  }

  editInstrumentsListItems(value: StockInstrumentList): Observable<Response<StockInstrumentList>> {
    return this._http.patch<Response<StockInstrumentList>>(`${this.host}/api/v1/instruments-lists/edit`, value);
  }

  public getActiveStock(list: StockId[]): Observable<StockPrice<WithLastPrice>> {
    return this._http
      .post<Response<StockPrice<WithLastPrice>>>(`${this.host}/api/v1/instruments/last-close-price/by-ids`, {
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
    return this._http.get<Response<ResponsePositions>>(`${this.host}/api/v1/ideas/positions`).pipe(
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
        ? new Date(new Date(lastYear - 2, 0, 1, 23).setUTCHours(0, 0, 0, 0)).toISOString()
        : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    return this._http
      .get<Response<any>>(`${this.host}/api/v1/candles`, {
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
      .get<Response<ActiveZone | null> | null>(`${this.host}/api/v1/chart/idea-consolidation-zone`, {
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
    return this._http.get<any>(`${this.host}/api/v1/chart/watchlist-consolidation-zone`, { params: { id } }).pipe(
      catchError((error: Error) => {
        console.log(error);
        return of(null);
      })
    );
  }

  getIndicatorAtr(id: StockId, interval: number, date: string): Observable<Response<any>> {
    return this._http.get<Response<any>>(`${this.host}/api/v1/chart/atr`, { params: { id, interval, date } }).pipe(
      catchError((err) => {
        return of({
          data: null,
          message: err.message,
          success: false,
        });
      })
    );
  }

  getIndicatorEma(params: IndicatorEmaParams): Observable<Response<any>> {
    return this._http.post<Response<any>>(`${this.host}/api/v1/chart/ema`, params);
  }

  getIndicatorSma(params: IndicatorSmaParams): Observable<Response<any>> {
    return this._http.post<Response<any>>(`${this.host}/api/v1/chart/sma`, params);
  }

  getConsolidationZones(params: { id: string; interval: number; from: string; to: string }): Observable<Response<any>> {
    return this._http.get<Response<any>>(`${this.host}/api/v1/chart/consolidation-zones`, { params });
  }

  getAccountBrokers(params: Params): Observable<Response<DataList<AccountBroker>>> {
    return this._http.get<Response<DataList<AccountBroker>>>(`${this.host}/api/v1/account/brokers`, {
      params,
    });
  }

  getAccountBalance(params: Params): Observable<Response<AccountBalance>> {
    return this._http.post<Response<AccountBalance>>(`${this.host}/api/v1/account/balance`, params);
  }

  getAccountBalanceHistory(params: Params): Observable<Response<AccountBalanceHistory>> {
    return this._http.post<Response<AccountBalanceHistory>>(`${this.host}/api/v1/account/balance/history`, params);
  }

  getBalancePortfolioBrokerCurrency(params: Params): Observable<Response<any>> {
    return this._http.get<Response<DataList<AccountCurrency>>>(
      `${this.host}/api/v1/account/portfolios/${params['portfolioId']}/brokers/${params['brokerId']}/currencies/${params['currencyId']}`
    );
  }

  addToAccountDeposit(params: Params): Observable<Response<AccountDeposit>> {
    return this._http.post<Response<AccountDeposit>>(`${this.host}/api/v1/account/deposit`, params);
  }

  subToAccountDeposit(params: Params): Observable<Response<AccountDeposit>> {
    return this._http.post<Response<AccountDeposit>>(`${this.host}/api/v1/account/withdrawal`, params);
  }

  getAccountCurrencies(params: Params): Observable<Response<DataList<AccountCurrency>>> {
    return this._http.get<Response<DataList<AccountCurrency>>>(`${this.host}/api/v1/account/currencies`, {
      params,
    });
  }

  getAccountPortfolios(params: Params): Observable<Response<DataList<AccountPortfolio>>> {
    return this._http.get<Response<DataList<AccountPortfolio>>>(`${this.host}/api/v1/account/portfolios`, {
      params,
    });
  }

  getAccountTransactions(params: Params): Observable<Response<AccountTransactions>> {
    return this._http.post<Response<AccountTransactions>>(`${this.host}/api/v1/account/transactions`, params);
  }

  getAccountStrategies(): Observable<Response<DataList<AccountStrategies>>> {
    return this._http.get<Response<DataList<AccountStrategies>>>(`${this.host}/api/v1/ideas/strategies`);
  }

  createAccountPortfolio(portfolio: string): Observable<Response<AccountPortfolio>> {
    return this._http.post<Response<AccountPortfolio>>(`${this.host}/api/v1/account/portfolio`, {
      portfolio,
    });
  }

  editAccountPortfolio(portfolio: AccountPortfolio): Observable<Response<AccountPortfolio>> {
    return this._http.patch<Response<AccountPortfolio>>(`${this.host}/api/v1/account/portfolio`, {
      ...portfolio,
    });
  }

  deleteAccountPortfolio(portfolioId: number): Observable<Response<AccountPortfolio>> {
    return this._http.delete<Response<AccountPortfolio>>(`${this.host}/api/v1/account/portfolio`, {
      body: { portfolioId },
    });
  }

  getPortfolio(params: Params): Observable<DataList<PortfolioPosition> | null> {
    return this._http.post<Response<DataList<PortfolioPosition>>>(`${this.host}/api/v1/ideas/portfolio`, params).pipe(
      map((result: Response<DataList<PortfolioPosition>>) => {
        return {
          total: result.data.total,
          items: result.data.items.map((item) => ({ ...item, ideaId: item.ideaId.toString() })),
        };
      }),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    );
  }

  getIdea(id: StockId): Observable<StockPosition | null> {
    return this._http
      .get<Response<StockPosition>>(`${this.host}/api/v1/ideas/${id}`)
      .pipe(map((response: Response<StockPosition>): StockPosition => response.data));
  }

  deleteIdea(id: StockId): Observable<number | null> {
    return this._http
      .delete<Response<number>>(`${this.host}/api/v1/ideas/${id}`)
      .pipe(map((response: Response<number>): number => response.data));
  }

  createIdea(body: object): Observable<Response<{ id: number }>> {
    return this._http.post<Response<{ id: number }>>(`${this.host}/api/v1/ideas/create`, body);
  }

  editIdea(id: StockId, body: object): Observable<Response<{ id: number }>> {
    return this._http.patch<Response<{ id: number }>>(`${this.host}/api/v1/ideas/${id}`, body);
  }

  setSubscribe(ideaId: number): Observable<Response<{ subscribed: boolean }>> {
    return this._http.post<
      Response<{
        subscribed: boolean;
      }>
    >(`${this.host}/api/v1/ideas/${ideaId}/subscribe`, { ideaId });
  }

  setUnsubscribe(ideaId: number): Observable<Response<{ subscribed: boolean }>> {
    return this._http.post<
      Response<{
        subscribed: boolean;
      }>
    >(`${this.host}/api/v1/ideas/${ideaId}/unsubscribe`, { ideaId });
  }

  getAccountStructure(params: Params): Observable<Response<AccountStructure>> {
    return this._http.post<Response<AccountStructure>>(`${this.host}/api/v1/account/portfolios/structure`, params);
  }

  getCommission(params: Params): Observable<Response<Commission>> {
    return this._http.post<Response<Commission>>(`${this.host}/api/v1/comission/portfolio`, params);
  }

  addCommission(params: Params): Observable<Response<any>> {
    return this._http.post<Response<any>>(`${this.host}/api/v1/comission`, params);
  }

  updateCommission(id: number, params: Params): Observable<Response<any>> {
    return this._http.patch<Response<any>>(`${this.host}/api/v1/comission/${id}`, params);
  }

  deleteCommission(id: number): Observable<Response<any>> {
    return this._http.delete<Response<any>>(`${this.host}/api/v1/comission/${id}`);
  }
}
