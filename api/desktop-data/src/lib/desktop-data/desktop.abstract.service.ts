import { Observable } from 'rxjs';
import { Idea } from 'types/idea';
import { Response } from 'types/response';
import {
  Stock,
  StockGroup,
  StockId,
  StockInstrument,
  StockList,
  StockPrice,
  WithLastPrice,
} from 'types/stock';

import { ConsolidationZones } from 'types/chart';

export abstract class DesktopService {
  public abstract getIdeaList(): Observable<Idea[]>;

  public abstract getStockList(): Observable<Response<Stock>>;

  public abstract getList(): Observable<unknown>;

  public abstract getStock(id: StockId): Observable<StockInstrument[]>;

  public abstract getActiveStock(
    list: StockList
  ): Observable<Response<StockPrice<WithLastPrice>>>;

  public abstract getTradeList(): Observable<StockGroup[]>;

  public abstract getCandles(id: any): Observable<unknown>;

  public abstract getConsolidationZones(
    ideaId: string
  ): Observable<ConsolidationZones>;
}
