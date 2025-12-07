import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { DataAccessDealStore } from '@data-access-deal/store';
import { LayoutComponent } from '../layout/layout.component';

interface ValueSubmit {
  search: string;
  type: AccountType;
  strategy: AccountStrategy;
  currency: AccountCurrency;
  page: number;
  limit: number;
}

@Component({
  selector: 'deal-list-wrapper',
  standalone: true,
  imports: [AsyncPipe, LayoutComponent],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialListWrapper {
  readonly #dataAccessDealStore: DataAccessDealStore = inject(DataAccessDealStore);

  readonly response$ = this.#dataAccessDealStore.state$;

  onSubmit(value: ValueSubmit): void {
    const { currency, type, strategy, limit, page } = value;

    this.#dataAccessDealStore.loadPositions({
      currencyId: currency.currencyId,
      instrumentType: type.id,
      limit,
      page: page + 1,
      strategyId: strategy.id,
    });
  }
}
