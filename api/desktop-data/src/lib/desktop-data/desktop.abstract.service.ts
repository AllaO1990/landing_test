import { Observable } from 'rxjs';
import { StockId, StockListItem, StockNameItem } from 'types/stock';
import { Idea } from 'types/idea';

export abstract class DesktopService {
  public abstract getIdeaList(): Observable<Idea[]>;

  public abstract getStockList(): Observable<unknown>;

  public abstract getStock(id: StockId): Observable<StockListItem[]>;

  public abstract getTradeList(): Observable<StockNameItem[]>;
}
