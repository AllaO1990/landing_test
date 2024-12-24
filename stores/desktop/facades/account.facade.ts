import { MainStore } from 'stores/main.store';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';

@Injectable()
export class AccountFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly brokers$: Observable<null | AccountBroker[]> = this._store.account.brokers$;
  readonly currencies$: Observable<null | AccountCurrency[]> = this._store.account.currencies$;
  readonly portfolios$: Observable<null | AccountPortfolio[]> = this._store.account.portfolios$;

  readonly createPortfolio = this._store.account.createPortfolio;
  readonly editPortfolio = this._store.account.editPortfolio;
  readonly deletePortfolio = this._store.account.deletePortfolio;
}
