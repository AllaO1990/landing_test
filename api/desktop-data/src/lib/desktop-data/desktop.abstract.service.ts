import { Observable } from 'rxjs';
import { DataList, Response } from 'types/response';
import {
  Stock,
  StockId,
  StockInstrumentList,
  StockLinkListInstrument,
  StockLists,
  StockParamsConsolidationZones,
  StockPrice,
  WithLastPrice,
} from 'types/stock';

import { ActiveZone, FigureIdea } from 'types/chart';
import { Position } from 'types/position';
import { IndicatorEmaParams } from 'types/indicator-ema';
import { IndicatorSmaParams } from 'types/indicator-sma';
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
} from 'types/account';
import { PortfolioPosition } from 'types/portfolio';
import { Commission } from 'types/commission';

export abstract class DesktopService {
  public abstract getIdeaList(): Observable<Position[]>;

  abstract getIdea(id: number | string): Observable<any>;

  abstract createIdea(body: object): Observable<any>;

  abstract editIdea(id: StockId, body: object): Observable<Response<any>>;

  abstract deleteIdea(id: StockId): Observable<number | null>;

  public abstract getStockList(params: Params): Observable<Response<Stock>>;

  public abstract getInstrumentsLists(): Observable<Response<{ items: StockLists }>>;

  public abstract getWatchInstrumentsListItems(): Observable<Response<Stock>>;

  public abstract getInstrumentsListItems(listId: StockId): Observable<Response<Stock>>;

  public abstract addInstrumentsListItems(
    value: StockLinkListInstrument
  ): Observable<Response<StockLinkListInstrument>>;

  public abstract getActiveStock(list: StockId[]): Observable<StockPrice<WithLastPrice>>;

  public abstract getPositionList(): Observable<Position[]>;

  public abstract getCandles(id: any): Observable<any>;

  public abstract getChartFigures(
    ideaId: string,
    from: string,
    to: string
  ): Observable<Response<FigureIdea | null> | null>;

  public abstract getIdeaConsolidationZone(ideaId: string): Observable<Response<ActiveZone | null> | null>;

  public abstract getWatchlistConsolidationZone(id: StockId): Observable<Response<ActiveZone> | null>;

  public abstract getIndicatorAtr(id: StockId, interval: number, date: string): Observable<Response<any>>;

  public abstract getIndicatorEma(params: IndicatorEmaParams): Observable<Response<any>>;

  public abstract getIndicatorSma(params: IndicatorSmaParams): Observable<Response<any>>;

  public abstract createInstrumentsListItems(name: string): Observable<Response<StockInstrumentList>>;

  public abstract createDefaultInstrumentsListItems(): Observable<Response<{ items: StockLists }>>;

  public abstract deleteInstrumentsLists(name: string): Observable<Response<{ id: string }>>;

  public abstract editInstrumentsListItems(value: StockInstrumentList): Observable<Response<StockInstrumentList>>;

  public abstract deleteInstrumentsListsItems(
    value: StockLinkListInstrument
  ): Observable<Response<StockLinkListInstrument>>;

  public abstract getConsolidationZones(params: StockParamsConsolidationZones): Observable<Response<ActiveZone[]>>;

  abstract getAccountBrokers(params: Params): Observable<Response<DataList<AccountBroker>>>;

  abstract getAccountCurrencies(params: Params): Observable<Response<DataList<AccountCurrency>>>;

  abstract getAccountBalance(params: Params): Observable<Response<AccountBalance>>;

  abstract getAccountBalanceHistory(params: Params): Observable<Response<AccountBalanceHistory>>;

  abstract getAccountStructure(params: Params): Observable<Response<AccountStructure>>;

  abstract getBalancePortfolioBrokerCurrency(params: Params): Observable<Response<any>>;

  abstract addToAccountDeposit(params: Params): Observable<Response<AccountDeposit>>;

  abstract subToAccountDeposit(params: Params): Observable<Response<AccountDeposit>>;

  abstract getAccountPortfolios(params: Params): Observable<Response<DataList<AccountPortfolio>>>;

  abstract getAccountStrategies(): Observable<Response<DataList<AccountStrategies>>>;

  abstract createAccountPortfolio(name: string): Observable<Response<AccountPortfolio>>;

  abstract editAccountPortfolio(portfolio: AccountPortfolio): Observable<Response<AccountPortfolio>>;

  abstract deleteAccountPortfolio(id: number): Observable<Response<AccountPortfolio>>;

  abstract getPortfolio(params: Params): Observable<DataList<PortfolioPosition> | null>;

  abstract setSubscribe(id: number): Observable<Response<{ subscribed: boolean }>>;

  abstract setUnsubscribe(id: number): Observable<Response<{ subscribed: boolean }>>;

  abstract getCommission(params: Params): Observable<Response<Commission>>;

  abstract addCommission(params: Params): Observable<Response<any>>;

  abstract updateCommission(id: number, params: Params): Observable<Response<any>>;

  abstract deleteCommission(id: number): Observable<Response<any>>;
}
