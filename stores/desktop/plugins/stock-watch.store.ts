import { ComponentStore } from '@ngrx/component-store';
import { Stock, StockListItems } from 'types/stock';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { DesktopService } from '@desktop-data/desktop-data';
import { filter } from 'rxjs/operators';
import { Response } from 'types/response';

export interface StockWatchState {
  list: null | StockListItems;
}

export class StockWatchStore extends ComponentStore<StockWatchState> {
  readonly list$: Observable<StockListItems | null> = this.select((state: StockWatchState) => state.list);

  updateList = this.updater(
    (state: StockWatchState, list: StockListItems): StockWatchState => ({
      ...state,
      list,
    })
  );

  readonly load = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api.getWatchInstrumentsListItems().pipe(
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

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }
}
