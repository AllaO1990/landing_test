import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable, of } from 'rxjs';
import { Position } from 'types/position';
import { StockId, StockTransaction } from 'types/stock';

@Injectable()
export class PositionFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<Position[] | null> = this._store.position.list$;
  readonly select$: Observable<null | StockTransaction> = this._store.selected.position$;

  selectItem(id: StockId | null): Observable<Position | null> {
    if (id === null) {
      return of(null);
    }
    return this._store.position.selectItem(id);
  }
}
