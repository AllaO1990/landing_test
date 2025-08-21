import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { StockIdeaState } from 'types/stock-idea-state';
import { StockId, StockInstrument, StockPrice, WithLastPrice } from 'types/stock';
import {
  Position,
  Positions,
  ResponsePosition,
  ResponsePositions,
  StockPosition,
  StockPositionIdeaEntry,
  StockPositionTarget,
} from 'types/position';
import { Response } from 'types/response';
import { QueryParams } from 'utils/query-params';
import { filter, take } from 'rxjs/operators';
import { EventSelected } from 'types/events';
import { Params } from '@angular/router';

export class StockIdeaStore extends ComponentStore<StockIdeaState> {
  readonly ideas$: Observable<Positions | null> = this.select((state: StockIdeaState) => state.ideas);
  readonly positions$: Observable<Positions | null> = this.select((state: StockIdeaState) => state.positions);
  readonly idea$: Observable<StockPosition | null> = this.select((state: StockIdeaState) => state.idea);
  readonly lastPrice$: Observable<null | WithLastPrice> = this.select((state: StockIdeaState) => state.lastPrice);
  readonly instrument$: Observable<StockInstrument | null> = this.select((state: StockIdeaState) => state.instrument);
  readonly isLoading$: Observable<boolean> = this.select((state: StockIdeaState) => state.isLoading);

  constructor(private readonly _api: DesktopService, private readonly _queryParams: QueryParams) {
    super({
      instrument: null,
      ideas: null,
      idea: null,
      positions: null,
      isLoading: false,
      lastPrice: null,
    });
  }

  updateIdeas = this.updater(
    (state: StockIdeaState, ideas: Positions | null): StockIdeaState => ({
      ...state,
      ideas,
    })
  );

  updateLastPrice = this.updater(
    (state: StockIdeaState, lastPrice: null | WithLastPrice): StockIdeaState => ({
      ...state,
      lastPrice,
    })
  );

  updatePositions = this.updater(
    (state: StockIdeaState, positions: Positions | null): StockIdeaState => ({
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

  updateInstrument = this.updater((state: StockIdeaState, instrument: StockInstrument | null): StockIdeaState => {
    return {
      ...state,
      instrument,
    };
  });

  updateIsLoading = this.updater(
    (state: StockIdeaState, isLoading: boolean): StockIdeaState => ({
      ...state,
      isLoading,
    })
  );

  updateIdeaUser = () => {
    this.setState((state: StockIdeaState): StockIdeaState => {
      const data = state.idea;

      if (data === null) {
        return state;
      }

      return {
        ...state,
        idea: this._copyIdea(data),
      };
    });
  };

  // selectIdea(id: StockId): Observable<Position | null> {
  //   return this.select((state: StockIdeaState) => {
  //     if (!state.ideas) {
  //       return null;
  //     }
  //
  //     return state.ideas.find((item: Position) => item.id === id) || null;
  //   });
  // }

  selectFromAll(id: StockId): Observable<Position | null> {
    return this.select((state: StockIdeaState) => {
      if (!state.ideas && !state.positions) {
        return null;
      }

      return (
        [...((state.ideas && state.ideas.items) || []), ...((state.positions && state.positions.items) || [])].find(
          (idea: Position) => idea.id === id
        ) || null
      );
    });
  }

  readonly loadIdeas = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api.getIdeaList(params).pipe(
          map((response: ResponsePositions) => ({
            ...response,
            items: response.items && response.items.map((item: ResponsePosition) => new Position(item)),
          })),
          tap((result: Positions) => this.updateIdeas(result))
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  readonly loadPositions = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api.getPositionList(params).pipe(
          map((response: ResponsePositions) => ({
            ...response,
            items: response.items && response.items.map((item: ResponsePosition) => new Position(item)),
          })),
          tap((result: Positions) => this.updatePositions(result))
        )
      )
    )
  );

  readonly loadIdea = this.effect((stream$: Observable<number | null>) =>
    stream$.pipe(
      switchMap((value: number | null) => {
        if (value === null) {
          return of(null);
        }

        return this._api
          .getIdea(value)
          .pipe(catchError((err) => of(null).pipe(tap(() => this._queryParams.update(null, '')))));
      }),
      tap((result: Response<StockPosition | null> | null) => result && this.updateIdea(result.data))
    )
  );

  readonly loadAndCopyIdea = this.effect((stream$: Observable<number | null>) =>
    stream$.pipe(
      switchMap((value: number | null) => {
        if (value === null) {
          return of(null);
        }

        return this._api
          .getIdea(value)
          .pipe(catchError((err) => of(null).pipe(tap(() => this._queryParams.update(null, '')))));
      }),
      tap((result: Response<StockPosition | null> | null) => result && this.updateIdea(this._copyIdea(result.data)))
    )
  );

  readonly create = this.effect((stream$: Observable<object>) =>
    stream$.pipe(
      tap(() => this.updateIsLoading(true)),
      switchMap((body: any) =>
        this._api.createIdea(body).pipe(
          catchError((err: Error) => {
            console.error(err);
            this.updateIsLoading(false);

            return of({
              data: { id: null },
              message: 'Error editing Idea',
              success: false,
            });
          }),
          filter(
            (
              response: Response<{ id: number | null }>
            ): response is Response<{
              id: number;
            }> => response.data.id !== null
          ),
          tap((response: Response<{ id: number }>) => {
            this.loadIdeas(of({}));
            this.loadPositions(of(null));

            // if (+response.data.id !== null) {
            //   this.loadIdea(+response.data.id);
            // }
          }),

          switchMap((response: Response<{ id: number }>) =>
            this.selectFromAll(response.data.id).pipe(
              filter((position: Position | null): position is Position => position !== null),
              take(1),
              tap((position: Position) => {
                console.log(position);

                this._queryParams.update({
                  type: body.actions.entries.length === 0 ? EventSelected.IDEA : EventSelected.POSITION,
                  id: response.data.id,
                  dialog: 'visible',
                });
              }),
              tap(() => this.updateIsLoading(false))
            )
          )
        )
      )
    )
  );

  readonly edit = this.effect((stream$: Observable<{ id: StockId; body: object }>) =>
    stream$.pipe(
      tap(() => this.updateIsLoading(true)),
      switchMap((data: { id: StockId; body: any }) =>
        this._api.editIdea(data.id, data.body).pipe(
          catchError((err: Error) => {
            console.error(err);
            this.updateIsLoading(false);

            return of({
              data: { id: null },
              message: 'Error editing Idea',
              success: false,
            });
          }),
          filter(
            (
              response: Response<{ id: number | null }>
            ): response is Response<{
              id: number;
            }> => response.data.id !== null
          ),
          tap(() => this.updateIsLoading(false)),
          tap((response: Response<{ id: number }>) => {
            this.loadIdeas(of({}));
            this.loadPositions(of(null));

            if (+response.data.id === +data.id) {
              this.loadIdea(data.id);
            }
          }),

          switchMap((response: Response<{ id: number }>) =>
            this.selectFromAll(response.data.id).pipe(
              filter((position: Position | null): position is Position => position !== null),
              take(1),
              tap((position: Position) => {
                // console.log(position);

                const { trade } = this._queryParams.value();

                if (trade === 'visible') {
                  this._queryParams.update({
                    type: data.body.actions.entries.length === 0 ? EventSelected.IDEA : EventSelected.POSITION,
                    id: response.data.id,
                  });

                  return;
                }

                this._queryParams.update({
                  type: data.body.actions.entries.length === 0 ? EventSelected.IDEA : EventSelected.POSITION,
                  id: response.data.id,
                  dialog: 'visible',
                });
              }),
              tap(() => this.updateIsLoading(false))
            )
          )
        )
      )
    )
  );

  readonly delete = this.effect((stream$: Observable<StockId>) =>
    stream$.pipe(
      tap(() => this.updateIsLoading(true)),
      switchMap((id: StockId) =>
        this._api.deleteIdea(id).pipe(
          tap((response: number | null) => {
            this.loadIdeas(of({}));
            this.loadPositions(of(null));
            this._queryParams.update({}, '');
          }),
          tap(() => this.updateIsLoading(false))
        )
      )
    )
  );

  private _copyIdea(data: StockPosition | null): StockPosition | null {
    if (data === null) {
      return null;
    }

    const { actions, idea } = data;

    return {
      actions: {
        ...actions,
        entries: [],
        outs: [],
      },
      dividends: [],
      comissions: [],
      idea: {
        ...idea,
        author: 'user',
        id: null,
        parentId: idea.id,
        entries: idea.entries.map((item: StockPositionIdeaEntry) => ({ ...item, date: null })),
        targets: idea.targets.map((item: StockPositionTarget) => ({ ...item, stopDate: null })),
      },
    };
  }

  readonly loadLastPrice = this.effect((stream$: Observable<string | null>) =>
    stream$.pipe(
      switchMap((id: string | null) => {
        if (id === null) {
          return of(null);
        }

        return this._api.getActiveStock([id]).pipe(
          map((list: StockPrice<WithLastPrice>) => list[id]),
          tap((lastPrice: WithLastPrice | null) => this.updateLastPrice(lastPrice))
        );
      })
    )
  );
}
