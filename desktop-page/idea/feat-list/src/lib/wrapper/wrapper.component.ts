import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutComponent } from '../layout/layout.component';
import { DataAccessIdeaStore } from '@data-access-idea/store';
import { AsyncPipe } from '@angular/common';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { map } from 'rxjs/operators';

@Component({
  selector: 'idea-list-wrapper',
  standalone: true,
  imports: [LayoutComponent, AsyncPipe],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeaListWrapper {
  readonly #dataAccessIdeaStore: DataAccessIdeaStore = inject(DataAccessIdeaStore);

  readonly list$ = this.#dataAccessIdeaStore.state$.pipe(map((result) => result.data));

  onSubmit(value: { search: string; type: AccountType; strategy: AccountStrategy; currency: AccountCurrency }): void {
    const { currency, type, strategy } = value;

    this.#dataAccessIdeaStore.loadIdaes({
      currencyId: currency.currencyId,
      instrumentType: type.id,
      limit: 100,
      page: 1,
      strategyId: strategy.id,
    });
  }
}
