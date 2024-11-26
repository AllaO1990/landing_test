import { ComponentStore } from '@ngrx/component-store';

import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { DesktopService } from '@desktop-data/desktop-data';
import { StockPositionState } from 'types/stock-position-state';
import { Position } from 'types/position';
import { StockId } from 'types/stock';

export class StockPositionStore extends ComponentStore<StockPositionState> {
  readonly list$: Observable<Position[] | null> = this.select((state: StockPositionState) => state.list);

  updateList = this.updater(
    (state: StockPositionState, list: Position[]): StockPositionState => ({
      ...state,
      list,
    })
  );

  selectItem(id: StockId): Observable<Position | null> {
    return this.select((state: StockPositionState) => {
      if (!state.list) {
        return null;
      }

      return state.list.find((item: Position) => item.id === id) || null;
    });
  }

  readonly load = this.effect((stream$: Observable<unknown>) =>
    stream$.pipe(
      switchMap((_) => this._api.getPositionList().pipe(tap((result: Position[]) => this.updateList(result)))),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }
}
