import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Idea } from 'types/idea';
import { StockEntryState } from 'types/stock-entry-state';

export class EntryStore extends ComponentStore<StockEntryState> {
  public readonly selected$: Observable<Idea | null> = this.select((state: StockEntryState) => state.selected);

  public readonly list$: Observable<Idea[] | null> = this.select((state: StockEntryState) => state.list);

  // public readonly active$: Observable<StockId[] | null> = this.select((state: StockEntryState) => state.active);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      // active: null,
      selected: null,
    });
  }

  public updateSelected = this.updater(
    (state: StockEntryState, selected: Idea | null): StockEntryState => ({
      ...state,
      selected,
    })
  );

  public updateList = this.updater(
    (state: StockEntryState, list: Idea[]): StockEntryState => ({
      ...state,
      list,
    })
  );

  // public updateActive = this.updater(
  //   (state: StockEntryState, active: StockId[]): StockEntryState => ({
  //     ...state,
  //     active,
  //   })
  // );

  public readonly load = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api.getIdeaList().pipe(
          tap((result: Idea[]) => this.updateList(result))
          // tap((result: Idea[]) => this.updateActive(result.map((item: Idea) => item.instrument.id)))
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );
}
