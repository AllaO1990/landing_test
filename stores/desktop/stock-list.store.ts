import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import {
  Stock,
  StockInstrument,
  StockList,
  StockPrice,
  WithLastPrice,
} from '../../types/stock';
import { filter } from 'rxjs/operators';
import { Response } from '../../types/response';
import { DesktopService } from '../../api/desktop-data/src/lib/desktop-data';
import { StockListState } from '../../types/stock-list-state';

export class StockListStore extends ComponentStore<StockListState> {
  public readonly list$: Observable<StockList | null> = this.select(
    (state: StockListState) => state.list
  );

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }

  public updateList = this.updater((state: StockListState, list: StockList) => {
    const defaultPrice = list.reduce(
      (acc: StockPrice<WithLastPrice>, item: StockInstrument) => ({
        ...acc,
        [item.id]: null,
      }),
      {}
    );

    return { ...state, defaultPrice, list };
  });

  public readonly load = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api.getStockList().pipe(
          filter((result: Response<Stock>) => !!result.data),
          tap((result: Response<Stock>) => this.updateList(result.data.items))
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );
}
