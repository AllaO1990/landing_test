import { ComponentStore } from '@ngrx/component-store';
import { catchError, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import {
  Stock,
  StockGroups,
  StockGroupType,
  StockId,
  StockInstrument,
  StockList,
  StockListItems,
  StockLists,
} from 'types/stock';
import { filter, map } from 'rxjs/operators';
import { Response } from 'types/response';
import { StockListState } from 'types/stock-list-state';
import { DesktopService } from '@desktop-data/desktop-data';
import { sortText } from 'utils/sort-text';

export class StockListStore extends ComponentStore<StockListState> {
  public readonly selected$: Observable<StockInstrument | null> = this.select(
    (state: StockListState) => state.selected
  );

  readonly groups$: Observable<StockGroups | null> = this.select((state: StockListState) => state.groups);

  readonly map$: Observable<Map<string, StockListItems> | null> = this.select((state: StockListState) => state.map);

  public readonly list$: Observable<StockListItems | null> = this.select((state: StockListState) => state.list);

  public readonly active$: Observable<StockId[] | null> = this.select((state: StockListState) => state.active);

  constructor(private readonly _api: DesktopService) {
    super({
      groups: null,
      watch: null,
      list: null,
      map: null,
      active: null,
      selected: null,
    });
  }

  public readonly updateSelected = this.updater(
    (state: StockListState, selected: StockInstrument | null): StockListState => ({
      ...state,
      selected,
    })
  );

  public readonly updateLists = this.updater(
    (state: StockListState, groups: StockGroups): StockListState => ({
      ...state,
      groups,
    })
  );

  public readonly updateList = this.updater(
    (state: StockListState, list: StockListItems): StockListState => ({
      ...state,
      list,
    })
  );

  public readonly updateWatchList = this.updater(
    (state: StockListState, watch: StockListItems): StockListState => ({
      ...state,
      watch,
    })
  );

  public readonly updateMap = this.updater(
    (state: StockListState, map: Map<string, StockListItems>): StockListState => ({
      ...state,
      map,
    })
  );

  public readonly updateActive = this.updater(
    (state: StockListState, active: StockId[]): StockListState => ({
      ...state,
      active,
    })
  );

  public readonly loadList = this.effect((stream$: Observable<void>) =>
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

  public readonly load = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api.getInstrumentsLists().pipe(
          filter((result: Response<{ items: StockLists }>) => !!result.data),
          map((result: Response<{ items: StockLists }>) => this._getStockGroup(result.data.items)),
          tap((list: StockGroups) => this.updateLists(list)),
          switchMap((list: StockGroups) =>
            forkJoin(list.map((item: { id: string }) => this._getListItems(item.id))).pipe(
              tap((listItems: StockListItems[]) => this._updateMap(list, listItems))
            )
          )
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  private _getListItems(id: string): Observable<StockListItems> {
    if (id === 'watch') {
      return this._api
        .getWatchInstrumentsListItems()
        .pipe(map((result: Response<Stock>) => this._sortWatchList(result.data.items)));
    }

    return this._api.getInstrumentsListItems(id).pipe(map((result: Response<Stock>) => result.data.items));
  }

  private _getStockGroup(list: StockLists): StockGroups {
    return [
      ...list.map((item: StockList) => ({ ...item, type: StockGroupType.DEFAULT })),
      { id: 'watch', name: 'Watch List', type: StockGroupType.DEFAULT },
    ];
  }

  private _updateMap(list: StockGroups, listItems: StockListItems[]): void {
    const map = new Map<string, StockListItems>();
    let items: StockListItems = [];
    let watchList: StockListItems = [];

    list.forEach(({ id }: { id: string }, index: number) => {
      map.set(id, listItems[index]);

      if (id === 'watch') {
        watchList = [...watchList, ...listItems[index]];
      } else {
        items = [...items, ...listItems[index]];
      }
    });

    // this.updateWatchList(watchList);
    // this.updateList(items);
    this.updateMap(map);
  }

  private _sortWatchList(list: StockListItems): StockListItems {
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
