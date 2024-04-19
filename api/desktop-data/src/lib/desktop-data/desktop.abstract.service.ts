import { Observable } from 'rxjs';
import { Stock, StockId, StockListItem, StockName } from 'types/stock';
import { Idea } from 'types/idea';
import { Response } from 'types/response';

export abstract class DesktopService {
  public abstract getIdeaList(): Observable<Idea[]>;

  public abstract getStockList(): Observable<Response<Stock>>;

  public abstract getList(): Observable<unknown>;

  public abstract getStock(id: StockId): Observable<StockListItem[]>;

  public abstract getActiveStock(list: StockList): Observable<any>;

  public abstract getTradeList(): Observable<StockName[]>;
}
