import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ActiveZone, FigureIdea } from 'types/chart';
import { DataList, Response } from 'types/response';
import {
  Stock,
  StockId,
  StockInstrumentList,
  StockLinkListInstrument,
  StockLists,
  StockParamsConsolidationZones,
} from 'types/stock';
import { DesktopService } from './desktop.abstract.service';
import { Position } from 'types/position';
import { IndicatorEmaParams } from 'types/indicator-ema';
import { Params } from '@angular/router';
import { AccountBroker, AccountCurrency, AccountPortfolio, AccountStrategies } from 'types/account';
import { PortfolioPosition } from 'types/portfolio';

@Injectable()
export class DesktopStubService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  getIdeaList(): Observable<Position[]> {
    return of([]);
  }

  getInstrumentsLists(): Observable<any> {
    return of([]);
  }

  getInstrumentsListItems(listId: StockId): Observable<any> {
    return of([]);
  }

  addInstrumentsListItems(value: StockLinkListInstrument): Observable<Response<StockLinkListInstrument>> {
    return of();
  }

  getWatchInstrumentsListItems(): Observable<any> {
    return of([]);
  }

  getIdeaConsolidationZone(ideaId: string): Observable<Response<ActiveZone> | null> {
    return of();
  }

  getStockList(): Observable<Response<Stock>> {
    return of();
  }

  public getActiveStock(list: StockId[]): Observable<any> {
    return of();
  }

  getPositionList(): Observable<Position[]> {
    return of([]);
  }

  getList(): Observable<unknown> {
    return of([]);
  }

  getCandles(): Observable<any> {
    return of([]);
  }

  getChartFigures(): Observable<Response<FigureIdea | null> | null> {
    return of();
  }

  getWatchlistConsolidationZone(id: StockId): Observable<Response<ActiveZone> | null> {
    return of();
  }

  getIndicatorAtr(id: StockId, interval: number, date: string): Observable<Response<any>> {
    return of();
  }

  getIndicatorEma(params: IndicatorEmaParams): Observable<Response<any>> {
    return of();
  }

  getIndicatorSma(params: IndicatorEmaParams): Observable<Response<any>> {
    return of();
  }

  createInstrumentsListItems(name: string): Observable<Response<{ id: string; name: string }>> {
    return of();
  }

  createDefaultInstrumentsListItems(): Observable<Response<{ items: StockLists }>> {
    return of();
  }

  deleteInstrumentsLists(name: string): Observable<Response<{ id: string }>> {
    return of();
  }

  editInstrumentsListItems(value: StockInstrumentList): Observable<Response<StockInstrumentList>> {
    return of();
  }

  deleteInstrumentsListsItems(value: StockLinkListInstrument): Observable<Response<StockLinkListInstrument>> {
    return of();
  }

  getConsolidationZones(params: StockParamsConsolidationZones): Observable<Response<any>> {
    return of();
  }

  getAccountBrokers(params: Params): Observable<Response<DataList<AccountBroker>>> {
    return of();
  }

  getAccountCurrencies(params: Params): Observable<Response<DataList<AccountCurrency>>> {
    return of();
  }

  getAccountPortfolios(params: Params): Observable<Response<DataList<AccountPortfolio>>> {
    return of();
  }

  getAccountStrategies(): Observable<Response<DataList<AccountStrategies>>> {
    return of();
  }

  createAccountPortfolio(portfolio: string): Observable<Response<AccountPortfolio>> {
    return of();
  }

  editAccountPortfolio(portfolio: AccountPortfolio): Observable<Response<AccountPortfolio>> {
    return of();
  }

  deleteAccountPortfolio(portfolioId: number): Observable<Response<AccountPortfolio>> {
    return of();
  }

  getPortfolio(params: Params): Observable<PortfolioPosition[] | null> {
    return of();
  }

  getIdea(id: StockId): Observable<Response<any>> {
    return of();
  }

  override createIdea(body: object): Observable<any> {
    return of();
  }
}
