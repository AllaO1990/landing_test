import { ComponentStore } from '@ngrx/component-store';

import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { DesktopService } from '@desktop-data/desktop-data';
import { StockId } from 'types/stock';
import { StockPositionState } from 'types/stock-position-state';
import { Position } from 'types/position';

export class PositionStore extends ComponentStore<StockPositionState> {
  public readonly selected$: Observable<Position | null> = this.select((state: StockPositionState) => state.selected);

  public readonly list$: Observable<Position[] | null> = this.select((state: StockPositionState) => state.list);

  public readonly active$: Observable<StockId[] | null> = this.select((state: StockPositionState) => state.active);

  public updateSelected = this.updater(
    (state: StockPositionState, selected: Position | null): StockPositionState => ({
      ...state,
      selected,
    })
  );

  public updateList = this.updater(
    (state: StockPositionState, list: Position[]): StockPositionState => ({
      ...state,
      list,
    })
  );

  public updateActive = this.updater(
    (state: StockPositionState, active: StockId[]): StockPositionState => ({
      ...state,
      active,
    })
  );

  public readonly load = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api.getPositionList().pipe(
          tap((result: Position[]) => this.updateList(result)),
          tap((result: Position[]) => this.updateActive(result.map((item: Position) => item.instrument.id)))
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
      active: null,
      selected: null,
    });
  }
}
