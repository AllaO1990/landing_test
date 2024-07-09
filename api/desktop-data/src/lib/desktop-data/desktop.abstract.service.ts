import { Observable } from 'rxjs';
import { Idea } from 'types/idea';
import { Response } from 'types/response';
import { Stock, StockId, StockInstrument, StockPrice, WithLastPrice } from 'types/stock';

import { ConsolidationZones } from 'types/chart';
import { Position } from 'types/position';

export abstract class DesktopService {
  public abstract getIdeaList(): Observable<Idea[]>;

  public abstract getStockList(): Observable<Response<Stock>>;

  public abstract getList(): Observable<unknown>;

  public abstract getStock(id: StockId): Observable<StockInstrument[]>;

  public abstract getActiveStock(list: StockId[]): Observable<StockPrice<WithLastPrice>>;

  public abstract getTradeList(): Observable<Position[]>;

  public abstract getCandles(id: any): Observable<unknown>;

  public abstract getConsolidationZones(ideaId: StockId): Observable<ConsolidationZones>;
}
