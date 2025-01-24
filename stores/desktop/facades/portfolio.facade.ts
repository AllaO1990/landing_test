import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable, of } from 'rxjs';
import { PortfolioPosition } from 'types/portfolio';
import { StockId, StockTransaction } from 'types/stock';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';

@Injectable()
export class PortfolioFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<PortfolioPosition[] | null> = this._store.portfolio.list$;
  readonly total$: Observable<number | null> = this._store.portfolio.total$;
  readonly select$: Observable<null | StockTransaction> = this._store.selected.transaction$;
  readonly portfolio$: Observable<null | AccountPortfolio> = this._store.portfolio.portfolio$;
  readonly broker$: Observable<AccountBroker | null> = this._store.portfolio.broker$;
  readonly currency$: Observable<null | AccountCurrency> = this._store.portfolio.currency$;
  readonly range: Observable<null | any> = this._store.portfolio.range$;

  readonly load = this._store.portfolio.load;
  readonly updatePortfolio = this._store.portfolio.updatePortfolio;
  readonly updateBroker = this._store.portfolio.updateBroker;
  readonly updateCurrency = this._store.portfolio.updateCurrency;
  readonly updateToCurrency = this._store.portfolio.updateToCurrency;
  readonly updateRange = this._store.portfolio.updateRange;

  selectItem(id: StockId | null): Observable<PortfolioPosition | null> {
    if (id === null) {
      return of(null);
    }
    return this._store.portfolio.selectItem(id);
  }
}
