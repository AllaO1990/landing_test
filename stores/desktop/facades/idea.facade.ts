import { inject, Injectable } from '@angular/core';
import { MainStore } from '../main.store';
import { Observable } from 'rxjs';
import { Idea } from 'types/idea';
import { StockId } from 'types/stock';

@Injectable()
export class IdeaFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<Idea[] | null> = this._store.idea.list$;
  readonly select$: Observable<null | Idea> = this._store.selected.idea$;

  selectItem(id: StockId): Observable<Idea | null> {
    return this._store.idea.selectItem(id);
  }
}
