import { Observable } from 'rxjs';
import { Idea } from 'types/idea';
import { Response } from 'types/response';
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

export abstract class DesktopService {
  public abstract getIdeaList(): Observable<Idea[]>;

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
}
