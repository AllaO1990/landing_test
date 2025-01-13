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
import { AccountBroker, AccountCurrency, AccountPortfolio, AccountStrategies } from 'types/account';
import { PortfolioPosition } from 'types/portfolio';

export abstract class DesktopService {
  public abstract getIdeaList(): Observable<Position[]>;

  abstract getIdea(id: StockId): Observable<any>;

  abstract createIdea(body: object): Observable<any>;

  abstract editIdea(id: StockId, body: object): Observable<any>;

  abstract deleteIdea(id: StockId): Observable<number | null>;

  public abstract getStockList(): Observable<Response<Stock>>;

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

  abstract getAccountPortfolios(params: Params): Observable<Response<DataList<AccountPortfolio>>>;

  abstract getAccountStrategies(): Observable<Response<DataList<AccountStrategies>>>;

  abstract createAccountPortfolio(name: string): Observable<Response<AccountPortfolio>>;

  abstract editAccountPortfolio(portfolio: AccountPortfolio): Observable<Response<AccountPortfolio>>;

  abstract deleteAccountPortfolio(id: number): Observable<Response<AccountPortfolio>>;

  abstract getPortfolio(params: Params): Observable<PortfolioPosition[] | null>;
}
