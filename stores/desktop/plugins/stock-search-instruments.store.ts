import { ComponentStore } from '@ngrx/component-store';
import { Stock } from 'types/stock';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, switchMap, tap } from 'rxjs';
import { Response } from 'types/response';
import { Params } from '@angular/router';

interface StockSearchInstrumentsState {
  list: null | Stock;
  search: null | Stock;
}

export class StockSearchInstrumentsStore extends ComponentStore<StockSearchInstrumentsState> {
  readonly list$: Observable<Stock | null> = this.select((state: StockSearchInstrumentsState) => state.list);
  readonly searchList$: Observable<Stock | null> = this.select((state: StockSearchInstrumentsState) => state.search);

  updateList = this.updater((state: StockSearchInstrumentsState, list: Stock | null) => ({ ...state, list }));

  updateSearchList = this.updater((state: StockSearchInstrumentsState, search: Stock | null) => ({
    ...state,
    search,
  }));

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      search: null,
    });
  }

  readonly searchListInstrument = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api
          .searchStockListInstrument(params)
          .pipe(tap((response: Response<Stock>) => this.updateSearchList(response.success ? response.data : null)))
      )
    )
  );

  readonly loadListInstrument = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api.getStockList(params).pipe(tap((response: Response<Stock>) => this.updateList(response.data)))
      )
    )
  );

  readonly addSubscriptionStockListInstrument = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) => this._api.addSubscriptionStockListInstrument(params)),
      tap((data) => console.log(data))
    )
  );
}
