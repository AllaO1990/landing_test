import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { LayoutComponent } from '../layout/layout.component';
import { DataAccessIdeaStore } from '@data-access-idea/store';
import { AsyncPipe } from '@angular/common';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { DataAccessIdeaService } from '@data-access-idea/data-access.service';
import { Params } from '@angular/router';

interface ValueSubmit {
  search: string;
  type: AccountType;
  strategy: AccountStrategy;
  currency: AccountCurrency;
  page: number;
  limit: number;
}

@Component({
  selector: 'idea-list-wrapper',
  standalone: true,
  imports: [LayoutComponent, AsyncPipe],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeaListWrapper {
  readonly #dataAccessIdea: DataAccessIdeaService = inject(DataAccessIdeaService);
  readonly #dataAccessIdeaStore: DataAccessIdeaStore = inject(DataAccessIdeaStore);

  readonly response$ = this.#dataAccessIdeaStore.state$;

  constructor() {
    effect(() => {
      const params: Params | null = this.#dataAccessIdea.params();

      if (params !== null) {
        this.#dataAccessIdeaStore.loadIdaes(params);
      }
    });
  }

  onSubmit(value: ValueSubmit): void {
    const { currency, type, strategy, limit, page } = value;

    this.#dataAccessIdeaStore.loadIdaes({
      currencyId: currency.currencyId,
      instrumentType: type.id,
      limit,
      page: page + 1,
      strategyId: strategy.id,
    });
  }
}
