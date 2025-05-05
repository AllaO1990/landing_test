import { ComponentStore } from '@ngrx/component-store';
import { catchError, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import {
  Stock,
  StockGroup,
  StockGroupList,
  StockGroups,
  StockGroupType,
  StockInstrument,
  StockInstrumentList,
  StockLinkListInstrument,
  StockList,
  StockListItems,
  StockLists,
} from 'types/stock';
import { filter, map } from 'rxjs/operators';
import { Response } from 'types/response';
import { DesktopService } from '@desktop-data/desktop-data';
import { EventSelected } from 'types/events';
import { sortText } from 'utils/sort-text';

export interface StockState {
  list: null | StockListItems;
  group: null | StockGroupList[];
  now: number;
  instrument: null | StockInstrument;
}

export class StockListStore extends ComponentStore<StockState> {
  private readonly _watchGroup: StockGroup = {
    id: 'watch',
    name: 'Watch List',
    type: { action: StockGroupType.DEFAULT, event: EventSelected.WATCH_LIST },
  };

  private readonly _now$: Observable<number> = this.select((state: StockState) => state.now);

  /**
   * Весь список тикеров
   */
  readonly list$: Observable<StockListItems | null> = this.select((state: StockState) => state.list);
  /**
   * Собранный список групп и тикеров для Stock
   */
  readonly group$: Observable<null | StockGroupList[]> = this.select((state: StockState) => state.group);

  readonly instrument$: Observable<null | StockInstrument> = this.select((state: StockState) => state.instrument);

  /**
   * Получение определённой группы тикеров для Stock
   */
  selectStockGroupList = (id: string): Observable<StockGroupList | null> => {
    return this.select(
      {
        group: this.group$,
        now: this._now$,
      },
      { debounce: true }
    ).pipe(
      map(
        (select: { group: null | StockGroupList[] }) =>
          (select.group || []).find((item: StockGroupList) => item.id === id) || null
      )
    );
  };

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      group: null,
      instrument: null,
      now: Date.now(),
    });
  }

  updateList = this.updater((state: StockState, list: StockListItems | null) => ({ ...state, list }));
  updateGroup = this.updater((state: StockState, group: StockGroupList[] | null) => ({ ...state, group }));
  updateInstrument = this.updater((state: StockState, instrument: StockInstrument | null) => ({
    ...state,
    instrument,
  }));

  deleteGroup = this.updater((state: StockState, id: string) => {
    let group = null;

    if (state.group) {
      group = state.group.filter((item: StockGroupList) => item.id !== id);
    }

    return { ...state, group, now: Date.now() };
  });
  editGroup = this.updater((state: StockState, value: StockInstrumentList) => {
    let group = state.group;

    if (group) {
      const index = group.findIndex((item: StockGroupList) => item.id === value.id);
      if (index !== -1) {
        group[index] = { ...group[index], ...value };
      }
    }

    return { ...state, group, now: Date.now() };
  });
  createGroup = this.updater((state: StockState, value: StockInstrumentList) => {
    let group = state.group;

    if (group) {
      group = [
        {
          ...value,
          type: { action: StockGroupType.CUSTOM, event: EventSelected.STOCK_LIST },
          items: [],
        },
        ...group,
      ];
    }

    return { ...state, group };
  });

  addInstrument = this.updater((state: StockState, value: StockLinkListInstrument) => {
    let group = state.group;

    if (group && state.list) {
      const index = group.findIndex((item: StockGroupList) => item.id === value.instrumentsListId);
      const findInstrument = state.list.find((item: StockInstrument) => item.id === value.instrumentId);

      if (index !== -1 && findInstrument) {
        group[index].items = [findInstrument, ...group[index].items];
      }
    }

    return { ...state, group, now: Date.now() };
  });
  deleteInstrument = this.updater((state: StockState, value: StockLinkListInstrument) => {
    let group = state.group;

    if (group) {
      const index = group.findIndex((item: StockGroupList) => item.id === value.instrumentsListId);

      if (index !== -1) {
        group[index].items = group[index].items.filter((item: StockInstrument) => item.id !== value.instrumentId);
      }
    }

    return { ...state, group, now: Date.now() };
  });

  readonly loadList = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api.getStockList({ limit: 100 }).pipe(
          filter((result: Response<Stock>) => !!result.data),
          // switchMap((result: Response<Stock>) => {
          //   if (result.data.total === result.data.items.length) {
          //     return of(result.data.items);
          //   }
          //
          //   const countPages = Math.ceil(result.data.total / 100);
          //
          //   return forkJoin(
          //     Array.from({ length: countPages - 1 }, (_, index: number) =>
          //       this._api.getStockList({
          //         sub: false,
          //         limit: 100,
          //         page: index + 2,
          //       })
          //     )
          //   ).pipe(
          //     map(
          //       (commonResult: Response<Stock>[]): StockListItems => [
          //         ...result.data.items,
          //         ...commonResult.reduce((acc: StockListItems, item) => [...acc, ...item.data.items], []),
          //       ]
          //     )
          //   );
          // }),
          tap((response: Response<Stock>) => this.updateList(response.data.items))
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  readonly loadGroup = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api.getInstrumentsLists().pipe(
          filter((result: Response<{ items: StockLists | null }>) => !!result.data),
          switchMap((result: Response<{ items: StockLists | null }>) => {
            if (result.data.items === null) {
              return this._api.createDefaultInstrumentsListItems();
            }

            return of(result as Response<{ items: StockLists }>);
          }),
          map((result: Response<{ items: StockLists }>) => result.data.items),
          map((list: StockLists) => this._getStockGroup(list)),
          switchMap((list: StockGroups) =>
            forkJoin([
              ...list.map((item: StockList, index: number) =>
                this._api.getInstrumentsListItems(item.id).pipe(
                  map((result: Response<Stock>) => result.data.items || []),
                  map(
                    (items: StockListItems): StockGroupList => ({
                      ...list[index],
                      type: {
                        action: StockGroupType.CUSTOM,
                        event: EventSelected.STOCK_LIST,
                      },
                      items: items,
                    })
                  )
                )
              ),
              this._api.getWatchInstrumentsListItems().pipe(
                map((result: Response<Stock>) => this._sortWatchList(result.data.items)),
                map((items: StockListItems): StockGroupList => ({ ...this._watchGroup, items }))
              ),
            ]).pipe(tap((list: StockGroupList[]) => this.updateGroup(list)))
          )
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  private _getStockGroup(
    list: StockLists,
    type: {
      action: StockGroupType;
      event: EventSelected.STOCK_LIST | EventSelected.WATCH_LIST;
    } = {
      action: StockGroupType.CUSTOM,
      event: EventSelected.STOCK_LIST,
    }
  ): StockGroups {
    return list.map((item: StockList) => ({ ...item, type }));
  }

  readonly onDeleteGroup = this.effect((stream$: Observable<string>) =>
    stream$.pipe(
      switchMap((id: string) =>
        this._api.deleteInstrumentsLists(id).pipe(
          map((value: Response<{ id: string }>) => value.data),
          tap((value) => this.deleteGroup(value.id))
        )
      )
    )
  );

  readonly onEditGroup = this.effect((stream$: Observable<StockInstrumentList>) =>
    stream$.pipe(
      switchMap((value: StockInstrumentList) =>
        this._api.editInstrumentsListItems(value).pipe(
          map((value: Response<StockInstrumentList>) => value.data),
          tap(() => console.log('onEditGroup', value)),
          tap((value: StockInstrumentList) => this.editGroup(value))
        )
      )
    )
  );

  readonly onCreateGroup = this.effect((stream$: Observable<string>) =>
    stream$.pipe(
      switchMap((name: string) =>
        this._api.createInstrumentsListItems(name).pipe(
          map((value: Response<StockInstrumentList>) => value.data),
          tap((value: StockInstrumentList) => this.createGroup(value))
        )
      )
    )
  );

  readonly onAddInstrument = this.effect((stream$: Observable<StockLinkListInstrument>) =>
    stream$.pipe(
      switchMap((value: StockLinkListInstrument) =>
        this._api.addInstrumentsListItems(value).pipe(
          map((value: Response<StockLinkListInstrument>) => value.data),
          tap((value: StockLinkListInstrument) => this.addInstrument(value))
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of({ data: null });
      })
    )
  );

  readonly onDeleteInstrument = this.effect((stream$: Observable<StockLinkListInstrument>) =>
    stream$.pipe(
      switchMap((value: StockLinkListInstrument) =>
        this._api.deleteInstrumentsListsItems(value).pipe(
          map((value: Response<StockLinkListInstrument>) => value.data),
          tap((value: StockLinkListInstrument) => this.deleteInstrument(value))
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

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
