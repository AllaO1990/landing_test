import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ActiveZone, ConsolidationZones } from 'types/chart';
import { Idea, ResponseIdea, ResponseListIdea } from 'types/idea';
import { Response, ResponseMessage } from 'types/response';
import {
  Stock,
  StockId,
  StockInstrumentList,
  StockLinkListInstrument,
  StockLists,
  StockParamsConsolidationZones,
} from 'types/stock';
import { getPriceIncrement } from 'utils/get-price-increment';
import { DesktopService } from './desktop.abstract.service';
import { Position } from 'types/position';
import { IndicatorEmaParams } from 'types/indicator-ema';

@Injectable()
export class DesktopStubService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  getIdeaList(): Observable<Idea[]> {
    return this._http.get<Response<ResponseListIdea>>('/assets/mocks/ideas-response.json').pipe(
      filter((response: Response<ResponseListIdea>) => response.message === ResponseMessage.success),
      map((response: Response<ResponseListIdea>) =>
        response.data.items.map((item: ResponseIdea) => ({
          ...item,
          priceIncrement: getPriceIncrement(item.minPriceIncrement),
        }))
      )
    );
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

  getChartFigures(): Observable<ConsolidationZones> {
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
}
