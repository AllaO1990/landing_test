import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable, of } from 'rxjs';
import { PortfolioPosition } from 'types/portfolio';
import { StockId, StockTransaction } from 'types/stock';
import {
  AccountBalance,
  AccountBalanceHistory,
  AccountBroker,
  AccountCurrency,
  AccountPortfolio,
  AccountRange,
  AccountStrategy,
  AccountStructure,
  AccountType,
} from 'types/account';

@Injectable()
export class PortfolioFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<PortfolioPosition[] | null> = this._store.portfolio.list$;
  readonly total$: Observable<{ total: number } | null> = this._store.portfolio.total$;
  readonly select$: Observable<null | StockTransaction> = this._store.selected.transaction$;
  readonly portfolio$: Observable<null | AccountPortfolio> = this._store.portfolio.portfolio$;
  readonly broker$: Observable<AccountBroker | null> = this._store.portfolio.broker$;
  readonly type$: Observable<AccountType | null> = this._store.portfolio.type$;
  readonly strategy$: Observable<AccountStrategy | null> = this._store.portfolio.strategy$;
  readonly currency$: Observable<null | AccountCurrency> = this._store.portfolio.currency$;
  readonly range$: Observable<null | AccountRange> = this._store.portfolio.range$;
  readonly balance$: Observable<null | AccountBalance> = this._store.portfolio.balance$;
  readonly balanceHistory$: Observable<null | AccountBalanceHistory> = this._store.portfolio.balanceHistory$;
  readonly structure$: Observable<null | AccountStructure> = this._store.portfolio.structure$;

  readonly load = this._store.portfolio.load;
  readonly loadBalance = this._store.portfolio.loadBalance;
  readonly loadBalanceHistory = this._store.portfolio.loadBalanceHistory;
  readonly loadStructure = this._store.portfolio.loadStructure;
  readonly updatePortfolio = this._store.portfolio.updatePortfolio;
  readonly updateBroker = this._store.portfolio.updateBroker;
  readonly updateType = this._store.portfolio.updateType;
  readonly updateStrategy = this._store.portfolio.updateStrategy;
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
