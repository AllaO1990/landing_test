import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable, of } from 'rxjs';
import { PortfolioPosition } from 'types/portfolio';
import { StockId, StockTransaction } from 'types/stock';

@Injectable()
export class PortfolioFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<PortfolioPosition[] | null> = this._store.portfolio.list$;
  readonly select$: Observable<null | StockTransaction> = this._store.selected.transaction$;

  readonly load = this._store.portfolio.load;

  selectItem(id: StockId | null): Observable<PortfolioPosition | null> {
    if (id === null) {
      return of(null);
    }
    return this._store.portfolio.selectItem(id);
  }
}
