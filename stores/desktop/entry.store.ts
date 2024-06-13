import { ComponentStore } from '@ngrx/component-store';
import { StockEntryState } from 'types/stock-entry-state';
import { DesktopService } from '../../api/desktop-data/src/lib/desktop-data';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Idea } from 'types/idea';

export class EntryStore extends ComponentStore<StockEntryState> {
  public readonly list$: Observable<Idea[] | null> = this.select(
    (state: StockEntryState) => state.list
  );

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }

  public updateList = this.updater(
    (state: StockEntryState, list: Idea[]): StockEntryState => ({
      ...state,
      list,
    })
  );

  public readonly load = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api
          .getIdeaList()
          .pipe(tap((result: Idea[]) => this.updateList(result)))
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );
}
