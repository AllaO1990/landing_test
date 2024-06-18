import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Stock, StockId, StockInstrument, StockList } from 'types/stock';
import { filter } from 'rxjs/operators';
import { Response } from 'types/response';
import { StockListState } from 'types/stock-list-state';
import { DesktopService } from '@desktop-data/desktop-data';

export class StockListStore extends ComponentStore<StockListState> {
  public readonly selected$: Observable<StockInstrument | null> = this.select(
    (state: StockListState) => state.selected
  );

  public readonly list$: Observable<StockList | null> = this.select(
    (state: StockListState) => state.list
  );

  public readonly active$: Observable<StockId[] | null> = this.select(
    (state: StockListState) => state.active
  );

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      active: null,
      selected: null,
    });
  }

  public readonly updateSelected = this.updater(
    (
      state: StockListState,
      selected: StockInstrument | null
    ): StockListState => ({
      ...state,
      selected,
    })
  );

  public readonly updateList = this.updater(
    (state: StockListState, list: StockList): StockListState => ({
      ...state,
      list,
    })
  );

  public readonly updateActive = this.updater(
    (state: StockListState, active: StockId[]): StockListState => ({
      ...state,
      active,
    })
  );

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
