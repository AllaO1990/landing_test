import { DesktopService } from './desktop.abstract.service';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  Stock,
  StockGroup,
  StockId,
  StockInstrument,
  StockList,
} from 'types/stock';
import { Idea, ResponseIdea, ResponseListIdea } from 'types/idea';
import { Response, ResponseMessage } from 'types/response';
import { filter } from 'rxjs/operators';
import { getPriceIncrement } from 'utils/get-price-increment';

@Injectable()
export class DesktopStubService extends DesktopService {
  private readonly _http: HttpClient = inject(HttpClient);

  getIdeaList(): Observable<Idea[]> {
    return this._http
      .get<Response<ResponseListIdea>>('/assets/mocks/ideas-response.json')
      .pipe(
        filter(
          (response: Response<ResponseListIdea>) =>
            response.message === ResponseMessage.success
        ),
        map((response: Response<ResponseListIdea>) =>
          response.data.items.map((item: ResponseIdea) => ({
            ...item,
            priceIncrement: getPriceIncrement(item.minPriceIncrement),
          }))
        )
      );
  }

  getStock(id: StockId): Observable<StockInstrument[]> {
    return of([]);
  }

  getStockList(): Observable<Response<Stock>> {
    return of();
  }

  public getActiveStock(list: StockList): Observable<any> {
    return of();
  }

  getTradeList(): Observable<StockGroup[]> {
    return of([]);
  }

  getList(): Observable<unknown> {
    return of([]);
  }

  getCandles(): Observable<any> {
    return of([]);
  }
}
