import { MainStore } from 'stores/main.store';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio, AccountStrategy, AccountType } from 'types/account';

@Injectable()
export class AccountFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly brokers$: Observable<null | AccountBroker[]> = this._store.account.brokers$;
  readonly brokersMap$: Observable<Map<number | null, AccountBroker>> = this._store.account.brokersMap$;
  readonly currencies$: Observable<null | AccountCurrency[]> = this._store.account.currencies$;
  readonly portfolios$: Observable<null | AccountPortfolio[]> = this._store.account.portfolios$;
  readonly strategies$: Observable<null | AccountStrategy[]> = this._store.account.strategies$;
  readonly types$: Observable<null | AccountType[]> = this._store.account.types$;
  readonly strategiesMap$: Observable<Map<string, AccountStrategy>> = this._store.account.strategiesMap$;

  readonly createPortfolio = this._store.account.createPortfolio;
  readonly editPortfolio = this._store.account.editPortfolio;
  readonly deletePortfolio = this._store.account.deletePortfolio;
}
