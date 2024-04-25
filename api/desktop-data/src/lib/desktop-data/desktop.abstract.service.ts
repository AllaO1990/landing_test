import { Observable } from 'rxjs';
import { Idea } from 'types/idea';
import { Response } from 'types/response';
import {
  Stock,
  StockGroup,
  StockId,
  StockList,
  StockListItem,
  StockListPrice,
  StockPrice,
} from 'types/stock';

export abstract class DesktopService {
  public abstract getIdeaList(): Observable<Idea[]>;

  public abstract getStockList(): Observable<Response<Stock>>;

  public abstract getList(): Observable<unknown>;

  public abstract getStock(id: StockId): Observable<StockListItem[]>;

  public abstract getActiveStock(
    list: StockList
  ): Observable<Response<StockPrice<StockListPrice>>>;

  public abstract getTradeList(): Observable<StockGroup[]>;

  public abstract getCandles(id: string): Observable<unknown>;
}
