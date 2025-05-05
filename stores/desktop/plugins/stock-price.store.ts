import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { StockPrice, WithLastPrice } from 'types/stock';
import { forkJoin, Observable, startWith, switchMap, tap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { breakArray } from 'utils/break-array';

export interface StockPriceState {
  list: null | StockPrice<WithLastPrice>;
}

export class StockPriceStore extends ComponentStore<StockPriceState> {
  readonly list$: Observable<StockPrice<WithLastPrice> | null> = this.select((state: StockPriceState) => state.list);

  readonly updateList = this.updater(
    (state: StockPriceState, list: StockPrice<WithLastPrice>): StockPriceState => ({
      ...state,
      list,
    })
  );

  readonly load = this.effect((stream$: Observable<string[] | null>) =>
    stream$.pipe(
      filter((list: string[] | null): list is string[] => !!list),
      switchMap((list: string[]) =>
        forkJoin(breakArray(list).map((subList: string[]) => this._api.getActiveStock(subList)))
      ),
      map((list: StockPrice<WithLastPrice>[]) => this._concatActivePrice(list)),
      startWith({}),
      tap((result: StockPrice<WithLastPrice>) => this.updateList(result))
    )
  );

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }

  private _concatActivePrice(list: StockPrice<WithLastPrice>[]): StockPrice<WithLastPrice> {
    return list.reduce(
      (acc: StockPrice<WithLastPrice>, item: StockPrice<WithLastPrice>): StockPrice<WithLastPrice> => ({
        ...acc,
        ...item,
      }),
      {}
    );
  }
}
