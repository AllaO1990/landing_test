import { ComponentStore } from '@ngrx/component-store';
import { catchError, distinctUntilChanged, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import {
  Stock,
  StockGroup,
  StockGroups,
  StockGroupType,
  StockId,
  StockInstrument,
  StockInstrumentList,
  StockLinkListInstrument,
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
  ).pipe(distinctUntilChanged((a: StockInstrument | null, b: StockInstrument | null) => a?.id === b?.id));

  readonly groups$: Observable<StockGroups | null> = this.select((state: StockListState) => state.groups);

  private _map$: Observable<Map<string, StockListItems> | null> = this.select((state: StockListState) => state.map);
  private _now$: Observable<number> = this.select((state: StockListState) => state.now);

  readonly map$: Observable<Map<string, StockListItems> | null> = this.select(
    {
      map: this._map$,
      now: this._now$,
    },
    { debounce: true }
  ).pipe(map((value: { map: Map<string, StockListItems> | null }) => value.map));

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
      now: Date.now(),
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

  readonly addToLists = this.updater((state: StockListState, group: StockGroup): StockListState => {
    const groupList: StockGroup[] = state.groups ? [...state.groups, group] : [group];
    const mapLIst: Map<string, StockListItems> = state.map || new Map<string, StockListItems>();

    mapLIst.set(group.id, []);

    return {
      ...state,
      groups: groupList,
      map: mapLIst,
    };
  });

  readonly addInstrumentToList = this.updater(
    (state: StockListState, link: StockLinkListInstrument): StockListState => {
      if (state.list === null || state.map === null) {
        return state;
      }

      const instrument: StockInstrument = state.list.find(
        (item: StockInstrument) => item.id === link.instrumentId
      ) as StockInstrument;
      const list: StockListItems = state.map.get(link.instrumentsListId) as StockListItems;

      state.map.set(link.instrumentsListId, [...list, instrument]);

      return {
        ...state,
        now: Date.now(),
      };
    }
  );

  readonly deleteInstrumentFromList = this.updater(
    (state: StockListState, link: StockLinkListInstrument): StockListState => {
      if (state.list === null || state.map === null) {
        return state;
      }

      const list: StockListItems = state.map.get(link.instrumentsListId) as StockListItems;
      const filteredList = list.filter((item: StockInstrument) => item.id !== link.instrumentId);

      state.map.set(link.instrumentsListId, filteredList);

      return {
        ...state,
        now: Date.now(),
      };
    }
  );

  readonly deleteOfLists = this.updater(
    (state: StockListState, id: string): StockListState => ({
      ...state,
      groups: state.groups ? state.groups.filter((item: StockGroup) => item.id !== id) : null,
    })
  );

  readonly editOfLists = this.updater((state: StockListState, value: StockInstrumentList): StockListState => {
    let groups = [{ ...value, type: StockGroupType.CUSTOM }];

    if (state.groups) {
      const index = state.groups.findIndex((item: StockGroup) => item.id === value.id);

      if (index !== -1) {
        state.groups[index] = { ...state.groups[index], ...value };
        groups = state.groups;
      }
    }

    return { ...state, groups: groups };
  });

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

  readonly create = this.effect((stream$: Observable<string>) =>
    stream$.pipe(
      switchMap((name: string) =>
        this._api.createInstrumentsListItems(name).pipe(
          map((value: Response<StockInstrumentList>) => value.data),
          tap((value: StockInstrumentList) => this.addToLists({ ...value, type: StockGroupType.CUSTOM }))
        )
      )
    )
  );

  readonly delete = this.effect((stream$: Observable<string>) =>
    stream$.pipe(
      switchMap((id: string) =>
        this._api.deleteInstrumentsLists(id).pipe(
          map((value: Response<{ id: string }>) => value.data),
          tap((value) => this.deleteOfLists(value.id))
        )
      )
    )
  );

  readonly edit = this.effect((stream$: Observable<StockInstrumentList>) =>
    stream$.pipe(
      switchMap((value: StockInstrumentList) =>
        this._api.editInstrumentsListItems(value).pipe(
          map((value: Response<StockInstrumentList>) => value.data),
          tap((value: StockInstrumentList) => this.editOfLists(value))
        )
      )
    )
  );

  readonly addInstrument = this.effect((stream$: Observable<StockLinkListInstrument>) =>
    stream$.pipe(
      switchMap((value: StockLinkListInstrument) =>
        this._api.addInstrumentsListItems(value).pipe(
          map((value: Response<StockLinkListInstrument>) => value.data),
          tap((value: StockLinkListInstrument) => this.addInstrumentToList(value))
        )
      )
    )
  );

  readonly deleteInstrument = this.effect((stream$: Observable<StockLinkListInstrument>) =>
    stream$.pipe(
      switchMap((value: StockLinkListInstrument) =>
        this._api.deleteInstrumentsListsItems(value).pipe(
          map((value: Response<StockLinkListInstrument>) => value.data),
          tap((value: StockLinkListInstrument) => this.deleteInstrumentFromList(value))
        )
      )
    )
  );

  private _getListItems(id: string): Observable<StockListItems> {
    if (id === 'watch') {
      return this._api
        .getWatchInstrumentsListItems()
        .pipe(map((result: Response<Stock>) => this._sortWatchList(result.data.items)));
    }

    return this._api.getInstrumentsListItems(id).pipe(map((result: Response<Stock>) => result.data.items || []));
  }

  private _getStockGroup(list: StockLists): StockGroups {
    return [
      ...list.map((item: StockList) => ({ ...item, type: StockGroupType.CUSTOM })),
      { id: 'watch', name: 'Watch List', type: StockGroupType.DEFAULT },
    ];
  }

  private _updateMap(list: StockGroups, listItems: StockListItems[]): void {
    const map: Map<string, StockListItems> = new Map<string, StockListItems>();
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
