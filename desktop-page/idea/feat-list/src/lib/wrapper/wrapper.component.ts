import { AfterViewInit, ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { LayoutComponent } from '../layout/layout.component';
import { DataAccessIdeaState, DataAccessIdeaStore } from '@data-access-idea/store';
import { AsyncPipe } from '@angular/common';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { DataAccessIdeaService } from '@data-access-idea/data-access.service';
import { Params } from '@angular/router';
import { filter, take } from 'rxjs';
import { QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { EventSelected } from 'types/events';

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
export class IdeaListWrapper implements AfterViewInit {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #dataAccessIdea: DataAccessIdeaService = inject(DataAccessIdeaService);
  readonly #dataAccessIdeaStore: DataAccessIdeaStore = inject(DataAccessIdeaStore);

  readonly response$ = this.#dataAccessIdeaStore.state$;

  constructor() {
    effect(() => {
      const params: Params | null = this.#dataAccessIdea.params();

      if (params !== null) {
        this.#dataAccessIdeaStore.loadIdeas(params);
      }
    });
  }

  ngAfterViewInit(): void {
    this.response$
      .pipe(
        filter((response: DataAccessIdeaState) => response.data !== null),
        take(1)
      )
      .subscribe((response: DataAccessIdeaState) => {
        const data = response.data && response.data.items;
        const id = this.#queryParams.value()['id'];

        if (data !== null && data.length && !id) {
          this.#queryParams.update({
            id: data[0].id,
            type: EventSelected.IDEA,
          });
        }
      });
  }

  onSubmit(value: ValueSubmit): void {
    const { currency, type, strategy, limit, page } = value;

    this.#dataAccessIdeaStore.loadIdeas({
      currencyId: currency.currencyId,
      instrumentType: type.id,
      limit,
      page: page + 1,
      strategyId: strategy.id,
    });
  }
}
