import { inject, Injectable } from '@angular/core';
import { MainStore } from '../main.store';
import { Observable, of } from 'rxjs';
import { StockId, StockTransaction } from 'types/stock';
import { Position } from 'types/position';

@Injectable()
export class IdeaFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<Position[] | null> = this._store.idea.list$;
  readonly select$: Observable<null | StockTransaction> = this._store.selected.idea$;

  selectItem(id: StockId): Observable<Position | null> {
    if (id === null) {
      return of(null);
    }

    return this._store.idea.selectItem(id);
  }
}
