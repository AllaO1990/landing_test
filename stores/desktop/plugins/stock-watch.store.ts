import { ComponentStore } from '@ngrx/component-store';
import { Stock, StockInstrument, StockListItems } from 'types/stock';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { DesktopService } from '@desktop-data/desktop-data';
import { filter } from 'rxjs/operators';
import { Response } from 'types/response';
import { sortText } from 'utils/sort-text';

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
          tap((result: Response<Stock>) => this.updateList(this._sortWatchList(result.data.items)))
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

  private _sortWatchList(list: StockListItems | null): StockListItems {
    if (list === null) {
      return [];
    }
    const { moex, crypto, forts } = list.reduce(
      (acc: { moex: StockListItems; crypto: StockListItems; forts: StockListItems }, item: StockInstrument) => {
        let type: 'moex' | 'crypto' | 'forts' = 'moex';

        if (item.realExchange === 'moex') {
          type = item.exchange === 'FORTS_EVENING' ? 'forts' : 'moex';
        } else {
          type = 'crypto';
        }
        acc[type].push(item);

        return acc;
      },
      { moex: [], crypto: [], forts: [] }
    );

    return [
      ...moex.sort((a, b) => sortText(a.ticker, b.ticker)),
      ...forts.sort((a, b) => sortText(a.ticker, b.ticker)),
      ...crypto.sort((a, b) => sortText(a.ticker, b.ticker)),
    ];
  }
}
