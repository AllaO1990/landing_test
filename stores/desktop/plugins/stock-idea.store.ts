import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { StockIdeaState } from 'types/stock-idea-state';
import { StockId } from 'types/stock';
import { Position } from 'types/position';

export class StockIdeaStore extends ComponentStore<StockIdeaState> {
  readonly list$: Observable<Position[] | null> = this.select((state: StockIdeaState) => state.list);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }

  updateList = this.updater(
    (state: StockIdeaState, list: Position[] | null): StockIdeaState => ({
      ...state,
      list,
    })
  );

  selectItem(id: StockId): Observable<Position | null> {
    return this.select((state: StockIdeaState) => {
      if (!state.list) {
        return null;
      }

      return state.list.find((item: Position) => item.id === id) || null;
    });
  }

  readonly load = this.effect((stream$: Observable<unknown>) =>
    stream$.pipe(
      switchMap((_) => this._api.getIdeaList().pipe(tap((result: Position[]) => this.updateList(result)))),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );
}
