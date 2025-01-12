import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { StockIdeaState } from 'types/stock-idea-state';
import { StockId } from 'types/stock';
import { Position, StockPosition } from 'types/position';

export class StockIdeaStore extends ComponentStore<StockIdeaState> {
  readonly list$: Observable<Position[] | null> = this.select((state: StockIdeaState) => state.list);

  readonly idea$: Observable<StockPosition | null> = this.select((state: StockIdeaState) => state.idea);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      idea: null,
    });
  }

  updateList = this.updater(
    (state: StockIdeaState, list: Position[] | null): StockIdeaState => ({
      ...state,
      list,
    })
  );

  updateIdea = this.updater(
    (state: StockIdeaState, idea: StockPosition | null): StockIdeaState => ({
      ...state,
      idea,
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

  readonly loadIdea = this.effect((stream$: Observable<StockId | null>) =>
    stream$.pipe(
      switchMap((value: StockId | null) => {
        if (value === null) {
          return of(null);
        }

        return this._api.getIdea(value);
      }),
      tap((result: StockPosition | null) => this.updateIdea(result))
    )
  );

  readonly create = this.effect((stream$: Observable<object>) =>
    stream$.pipe(
      switchMap((body: object) => this._api.createIdea(body).pipe(tap(() => this.load(of(null))))),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );
}
