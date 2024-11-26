import { inject, Injectable } from '@angular/core';
import { MainStore } from '../main.store';
import { Observable } from 'rxjs';
import { StockGroups, StockListItems } from 'types/stock';

@Injectable()
export class StockListFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<StockListItems | null> = this._store.stock.list$;
  readonly group$: Observable<StockGroups | null> = this._store.stock.groups$;

  constructor() {
    console.log('StockListFacade');
  }
}
