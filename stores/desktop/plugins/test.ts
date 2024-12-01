import { ComponentStore } from '@ngrx/component-store';
import { DesktopService } from '@desktop-data/desktop-data';
import { catchError, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Response } from 'types/response';
import {
  Stock,
  StockGroup,
  StockInstrument,
  StockInstrumentList,
  StockLinkListInstrument,
  StockList,
  StockListItems,
  StockLists,
  StockPrice,
  WithLastPrice,
} from 'types/stock';

export interface StockGroupState {
  list: null | StockListItems;
  group: null | StockLists;
  map: null | Map<string, StockListItems>;
  now: number;
  groups: null | (StockGroup & { items: StockPrice<WithLastPrice>[] }[]);
}

export class StockListStore extends ComponentStore<StockGroupState> {
  /**
   * Весь список тикеров
   */
  readonly list$: Observable<StockListItems | null> = this.select((state: StockGroupState) => state.list);
  /**
   * Пользовательские списки групп для Stock
   */
  readonly group$: Observable<StockLists | null> = this.select((state: StockGroupState) => state.group);
  readonly map$: Observable<Map<string, StockListItems> | null> = this.select((state: StockGroupState) => state.map);

  readonly updateList = this.updater(
    (state: StockGroupState, list: StockListItems | null): StockGroupState => ({
      ...state,
      list,
    })
  );

  readonly updateGroup = this.updater(
    (state: StockGroupState, group: null | StockLists): StockGroupState => ({
      ...state,
      group,
    })
  );

  readonly updateMap = this.updater(
    (state: StockGroupState, map: null | Map<string, StockInstrument[]>): StockGroupState => ({
      ...state,
      map,
    })
  );

  private readonly addInstrumentToList = this.updater(
    (state: StockGroupState, link: StockLinkListInstrument): StockGroupState => {
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

  private readonly deleteInstrumentFromList = this.updater(
    (state: StockGroupState, link: StockLinkListInstrument): StockGroupState => {
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

  private readonly updateInstrumentToList = (list: StockList, listItems: StockListItems) =>
    this.updater((state: StockGroupState): StockGroupState => {
      const mapList: Map<string, StockListItems> = state.map || new Map<string, StockListItems>();

      if (mapList.get(list.id)) {
        mapList.set(list.id, listItems);
      }

      return {
        ...state,
        map: mapList,
        now: Date.now(),
      };
    });

  private readonly addGroup = this.updater((state: StockGroupState, group: StockList): StockGroupState => {
    const groupList: StockLists = state.group ? [...state.group, group] : [group];
    const mapList: Map<string, StockListItems> = state.map || new Map<string, StockListItems>();

    mapList.set(group.id, []);

    return {
      ...state,
      group: groupList,
      map: mapList,
    };
  });

  private readonly removeGroup = this.updater(
    (state: StockGroupState, id: string): StockGroupState => ({
      ...state,
      group: state.group ? state.group.filter((item: StockList) => item.id !== id) : null,
    })
  );

  private readonly changeGroup = this.updater((state: StockGroupState, value: StockInstrumentList): StockGroupState => {
    let groups = [value];

    if (state.group) {
      const index = state.group.findIndex((item: StockList) => item.id === value.id);

      if (index !== -1) {
        state.group[index] = { ...state.group[index], ...value };
        groups = state.group;
      }
    }

    return { ...state, group: groups };
  });

  readonly loadList = this.effect((stream$: Observable<void>) =>
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
          tap((list: StockLists) => this.updateGroup(list)),
          switchMap((list: StockLists) =>
            forkJoin(
              list.map((item: StockList) =>
                this._api
                  .getInstrumentsListItems(item.id)
                  .pipe(map((result: Response<Stock>) => result.data.items || []))
              )
            ).pipe(tap((listItems: StockListItems[]) => this._createMap(list, listItems)))
          )
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
      map: null,
      group: null,
      now: Date.now(),
      groups: null,
    });
  }

  private _createMap(list: StockLists, listItems: StockListItems[]): void {
    const map: Map<string, StockListItems> = new Map<string, StockListItems>();

    list.forEach(({ id }: { id: string }, index: number) => {
      map.set(id, listItems[index]);
    });

    this.updateMap(map);
  }

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

  readonly createGroup = this.effect((stream$: Observable<string>) =>
    stream$.pipe(
      switchMap((name: string) =>
        this._api.createInstrumentsListItems(name).pipe(
          map((value: Response<StockInstrumentList>) => value.data),
          tap((value: StockInstrumentList) => this.addGroup(value))
        )
      )
    )
  );

  readonly deleteGroup = this.effect((stream$: Observable<string>) =>
    stream$.pipe(
      switchMap((id: string) =>
        this._api.deleteInstrumentsLists(id).pipe(
          map((value: Response<{ id: string }>) => value.data),
          tap((value) => this.removeGroup(value.id))
        )
      )
    )
  );

  readonly editGroup = this.effect((stream$: Observable<StockInstrumentList>) =>
    stream$.pipe(
      switchMap((value: StockInstrumentList) =>
        this._api.editInstrumentsListItems(value).pipe(
          map((value: Response<StockInstrumentList>) => value.data),
          tap((value: StockInstrumentList) => this.changeGroup(value))
        )
      )
    )
  );
}
