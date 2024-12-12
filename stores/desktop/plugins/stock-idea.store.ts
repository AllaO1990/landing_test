import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Idea } from 'types/idea';
import { StockIdeaState } from 'types/stock-idea-state';
import { StockId } from 'types/stock';

export class StockIdeaStore extends ComponentStore<StockIdeaState> {
  readonly list$: Observable<Idea[] | null> = this.select((state: StockIdeaState) => state.list);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }

  updateList = this.updater(
    (state: StockIdeaState, list: Idea[]): StockIdeaState => ({
      ...state,
      list,
    })
  );

  selectItem(id: StockId): Observable<Idea | null> {
    return this.select((state: StockIdeaState) => {
      if (!state.list) {
        return null;
      }

      return state.list.find((item: Idea) => item.id === id) || null;
    });
  }

  readonly load = this.effect((stream$: Observable<unknown>) =>
    stream$.pipe(
      switchMap((_) => this._api.getIdeaList().pipe(tap((result: Idea[]) => this.updateList(result)))),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );
}
