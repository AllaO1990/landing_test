import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { StockIdeaState } from 'types/stock-idea-state';
import { StockId } from 'types/stock';
import { Position, StockPosition, StockPositionIdeaEntry, StockPositionTarget } from 'types/position';
import { Response } from 'types/response';
import { QueryParams } from 'utils/query-params';

export class StockIdeaStore extends ComponentStore<StockIdeaState> {
  readonly list$: Observable<Position[] | null> = this.select((state: StockIdeaState) => state.list);

  readonly idea$: Observable<StockPosition | null> = this.select((state: StockIdeaState) => state.idea);

  constructor(private readonly _api: DesktopService, private readonly _queryParams: QueryParams) {
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

  updateIdeaUser = () => {
    this.setState((state: StockIdeaState): StockIdeaState => {
      const data = state.idea;

      if (data === null) {
        return state;
      }

      const { actions, idea } = data;

      return {
        ...state,
        idea: {
          actions: {
            ...actions,
            entries: [],
            outs: [],
          },
          idea: {
            ...idea,
            author: 'user',
            id: null,
            parentId: idea.id,
            entries: idea.entries.map((item: StockPositionIdeaEntry) => ({ ...item, date: null })),
            targets: idea.targets.map((item: StockPositionTarget) => ({ ...item, stopDate: null })),
          },
        },
      };
    });
  };

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

  readonly loadIdea = this.effect((stream$: Observable<number | string | null>) =>
    stream$.pipe(
      switchMap((value: number | string | null) => {
        if (value === null) {
          return of(null);
        }

        return this._api.getIdea(value).pipe(
          catchError((err) => {
            this._queryParams.update(null, '');
            return of(null);
          })
        );
      }),
      tap((result: StockPosition | null) => this.updateIdea(result))
    )
  );

  readonly create = this.effect((stream$: Observable<object>) =>
    stream$.pipe(
      switchMap((body: object) =>
        this._api.createIdea(body).pipe(
          tap((response: Response<{ id: number }>) => {
            this.load(response.data.id);
            this.loadIdea(response.data.id);
            console.log(response);
          })
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  readonly edit = this.effect((stream$: Observable<{ id: StockId; body: object }>) =>
    stream$.pipe(
      switchMap((data: { id: StockId; body: object }) =>
        this._api.editIdea(data.id, data.body).pipe(
          tap((response: Response<{ id: number }>) => {
            this.load(of(response.data.id));
            console.log(response);
          })
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  readonly delete = this.effect((stream$: Observable<StockId>) =>
    stream$.pipe(
      switchMap((id: StockId) =>
        this._api.deleteIdea(id).pipe(
          tap((response: number | null) => {
            console.log(response);
          })
        )
      )
    )
  );
}
