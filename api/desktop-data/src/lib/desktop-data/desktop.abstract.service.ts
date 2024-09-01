import { Observable } from 'rxjs';
import { Idea } from 'types/idea';
import { Response } from 'types/response';
import { Stock, StockId, StockPrice, WithLastPrice } from 'types/stock';

import { ActiveZone, ConsolidationZones } from 'types/chart';
import { Position } from 'types/position';
import { IndicatorEmaParams } from 'types/indicator-ema';
import { IndicatorSmaParams } from 'types/indicator-sma';

export abstract class DesktopService {
  public abstract getIdeaList(): Observable<Idea[]>;

  public abstract getStockList(): Observable<Response<Stock>>;

  public abstract getList(): Observable<unknown>;

  public abstract getInstrumentsLists(): Observable<Response<any>>;

  public abstract getWatchInstrumentsListItems(): Observable<Response<Stock>>;

  public abstract getInstrumentsListItems(listId: StockId): Observable<Response<Stock>>;

  public abstract getActiveStock(list: StockId[]): Observable<StockPrice<WithLastPrice>>;

  public abstract getPositionList(): Observable<Position[]>;

  public abstract getCandles(id: any): Observable<unknown>;

  public abstract getConsolidationZones(ideaId: StockId): Observable<ConsolidationZones>;

  public abstract getWatchlistConsolidationZone(id: StockId): Observable<Response<ActiveZone>>;

  public abstract getIndicatorAtr(id: StockId, interval: number, date: string): Observable<Response<any>>;

  public abstract getIndicatorEma(params: IndicatorEmaParams): Observable<Response<any>>;

  public abstract getIndicatorSma(params: IndicatorSmaParams): Observable<Response<any>>;
}
