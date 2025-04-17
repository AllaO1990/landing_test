import { ComponentStore } from '@ngrx/component-store';
import { Stock, StockInstrument, StockInstrumentToSubscription } from 'types/stock';
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

  patchSearchList = (response: StockInstrumentToSubscription, type: string) =>
    this.patchState((state: StockSearchInstrumentsState): Partial<StockSearchInstrumentsState> => {
      const list = state.list;
      const search = state.search;

      if (type === 'search' && search) {
        return { search: this._updateInListForIndex(search, response.instrument) };
      }

      if (list) {
        return { list: this._updateInListForIndex(list, response.instrument) };
      }

      return state;
    });

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      search: null,
    });
  }

  readonly resetSearchListInstrument = this.effect((stream$: Observable<void>) =>
    stream$.pipe(tap(() => this.updateSearchList(null)))
  );

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
      switchMap((params: Params) =>
        this._api
          .addSubscriptionStockListInstrument({ instrumentId: params['instrumentId'] })
          .pipe(
            tap((response: Response<StockInstrumentToSubscription>) =>
              this.patchSearchList(response.data, params['type'])
            )
          )
      )
    )
  );

  _updateInListForIndex(list: Stock, instrument: StockInstrument): Stock {
    const findIndex = list.items.findIndex((item: StockInstrument) => item.id === instrument.id);

    if (findIndex !== -1) {
      list.items[findIndex] = instrument;

      return { ...list };
    }

    return list;
  }
}
