import { ComponentStore } from '@ngrx/component-store';
import { Stock, StockListItems } from 'types/stock';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, switchMap, tap } from 'rxjs';
import { Response } from 'types/response';

interface StockSearchInstrumentsState {
  list: null | StockListItems;
  searchList: null | StockListItems;
  total: number | null;
}

export class StockSearchInstrumentsStore extends ComponentStore<StockSearchInstrumentsState> {
  readonly list$: Observable<StockListItems | null> = this.select((state: StockSearchInstrumentsState) => state.list);
  readonly searchList$: Observable<StockListItems | null> = this.select(
    (state: StockSearchInstrumentsState) => state.searchList
  );
  readonly total$: Observable<number | null> = this.select((state: StockSearchInstrumentsState) => state.total);

  updateList = this.updater((state: StockSearchInstrumentsState, list: StockListItems | null) => ({ ...state, list }));

  updateSearchList = this.updater((state: StockSearchInstrumentsState, searchList: StockListItems | null) => ({
    ...state,
    searchList,
  }));

  updateTotal = this.updater((state: StockSearchInstrumentsState, total: number | null) => ({ ...state, total }));

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      searchList: null,
      total: null,
    });
  }

  readonly searchListInstrument = this.effect((stream$: Observable<string>) =>
    stream$.pipe(
      switchMap((query: string) =>
        this._api
          .searchStockListInstrument({ query })
          .pipe(
            tap((response: Response<Stock>) =>
              this.updateSearchList(response.success && response.data.items === null ? [] : response.data.items)
            )
          )
      )
    )
  );

  readonly loadWithLimitListInstrument = (limit = 100) =>
    this.effect((stream$: Observable<number>) =>
      stream$.pipe(
        switchMap((page: number) =>
          this._api.getStockList({ page, limit }).pipe(
            tap((response: Response<Stock>) => this.updateList(response.data.items)),
            tap((response: Response<Stock>) => this.updateTotal(response.data.total))
          )
        )
      )
    );

  readonly loadListInstrument = this.loadWithLimitListInstrument(100);
}
