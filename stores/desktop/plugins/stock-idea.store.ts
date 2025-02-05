import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { StockIdeaState } from 'types/stock-idea-state';
import { StockId } from 'types/stock';
import { Position, StockPosition, StockPositionIdeaEntry, StockPositionTarget } from 'types/position';
import { Response } from 'types/response';
import { QueryParams } from 'utils/query-params';
import { filter, take } from 'rxjs/operators';
import { EventSelected } from 'types/events';

export class StockIdeaStore extends ComponentStore<StockIdeaState> {
  readonly ideas$: Observable<Position[] | null> = this.select((state: StockIdeaState) => state.ideas);
  readonly positions$: Observable<Position[] | null> = this.select((state: StockIdeaState) => state.positions);
  readonly idea$: Observable<StockPosition | null> = this.select((state: StockIdeaState) => state.idea);

  constructor(private readonly _api: DesktopService, private readonly _queryParams: QueryParams) {
    super({
      ideas: null,
      idea: null,
      positions: null,
    });
  }

  updateIdeas = this.updater(
    (state: StockIdeaState, ideas: Position[] | null): StockIdeaState => ({
      ...state,
      ideas,
    })
  );

  updatePositions = this.updater(
    (state: StockIdeaState, positions: Position[] | null): StockIdeaState => ({
      ...state,
      positions,
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

  selectIdea(id: StockId): Observable<Position | null> {
    return this.select((state: StockIdeaState) => {
      if (!state.ideas) {
        return null;
      }

      return state.ideas.find((item: Position) => item.id === id) || null;
    });
  }

  selectFromAll(id: StockId): Observable<Position | null> {
    return this.select((state: StockIdeaState) => {
      if (!state.ideas && !state.positions) {
        return null;
      }

      return [...(state.ideas || []), ...(state.positions || [])].find((idea: Position) => idea.id === id) || null;
    });
  }

  readonly loadIdeas = this.effect((stream$: Observable<unknown>) =>
    stream$.pipe(
      switchMap((_) => this._api.getIdeaList().pipe(tap((result: Position[]) => this.updateIdeas(result)))),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  readonly loadPositions = this.effect((stream$: Observable<unknown>) =>
    stream$.pipe(
      switchMap((_) => this._api.getPositionList().pipe(tap((result: Position[]) => this.updatePositions(result)))),
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

        return this._api
          .getIdea(value)
          .pipe(catchError((err) => of(null).pipe(tap(() => this._queryParams.update(null, '')))));
      }),
      tap((result: StockPosition | null) => this.updateIdea(result))
    )
  );

  readonly create = this.effect((stream$: Observable<object>) =>
    stream$.pipe(
      switchMap((body: object) =>
        this._api.createIdea(body).pipe(
          tap((response: Response<{ id: number }>) => {
            this.loadIdeas(of(null));

            this.selectIdea(response.data.id.toString())
              .pipe(
                filter((position: Position | null): position is Position => position !== null),
                take(1)
              )
              .subscribe(() => {
                this._queryParams.update({
                  type: EventSelected.IDEA,
                  id: response.data.id,
                  dialog: 'visible',
                });
              });
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
      switchMap((data: { id: StockId; body: any }) =>
        this._api.editIdea(data.id, data.body).pipe(
          tap((response: Response<{ id: number }>) => {
            this.loadIdeas(of(null));
            this.loadPositions(of(null));

            this.selectFromAll(response.data.id.toString())
              .pipe(
                filter((position: Position | null): position is Position => position !== null),
                take(1)
              )
              .subscribe(() => {
                this._queryParams.update({
                  type: data.body.actions.entries.length === 0 ? EventSelected.IDEA : EventSelected.POSITION,
                  id: response.data.id,
                });
              });
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
            this.loadIdeas(of(null));
            this.loadPositions(of(null));
            this._queryParams.update({}, '');
          })
        )
      )
    )
  );
}
