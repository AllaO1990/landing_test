import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { PORTFOLIO_CONSTANTS } from '@data-access-portfolio/constants';
import { AccountCurrency, AccountPortfolio } from 'types/account';
import { filter, Observable, shareReplay, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataAccessPortfolioService } from '@data-access-portfolio/data-access.service';
import { Params } from '@angular/router';

interface FilterValue {
  portfolio: AccountPortfolio;
  currency: AccountCurrency;
}

@Component({
  selector: 'portfolio-filter',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, TuiTextfield, TuiChevron, TuiSelect, TuiDataListWrapper, TuiButton],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPortfolioListComponent implements AfterViewInit {
  static valueDefaultCurrency = { currency: 'Все', currencySymbol: 'Все', currencyId: null };
  static valueDefaultPortfolio = { portfolio: 'Все', portfolioId: null };

  readonly #dataAccess: DataAccessPortfolioService = inject(DataAccessPortfolioService);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #accountFacade: AccountFacade = inject(AccountFacade);

  protected readonly size = 's';
  protected readonly constants = PORTFOLIO_CONSTANTS;

  stringifyCurrency = signal((x: AccountCurrency) => x.currencySymbol || '');
  identityMatcherCurrency = signal((a: AccountCurrency, b: AccountCurrency) => a.currencyId === b.currencyId);
  stringifyPortfolio = signal((x: AccountPortfolio) => x.portfolio);
  identityMatcherPortfolio = signal((a: AccountPortfolio, b: AccountPortfolio) => a.portfolioId === b.portfolioId);

  readonly currency$: Observable<AccountCurrency[] | null> = this.#accountFacade.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [FilterPortfolioListComponent.valueDefaultCurrency, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly portfolios$: Observable<AccountPortfolio[]> = this.#accountFacade.portfolios$.pipe(
    filter((list: null | AccountPortfolio[]): list is AccountPortfolio[] => list !== null),
    map((list: AccountPortfolio[]) => [FilterPortfolioListComponent.valueDefaultPortfolio, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly formGroup: FormGroup = new FormGroup({
    portfolio: new FormControl(FilterPortfolioListComponent.valueDefaultPortfolio),
    currency: new FormControl({ currency: 'rub', currencyId: 1, currencySymbol: '₽' }),
  });

  ngAfterViewInit(): void {
    this.formGroup.valueChanges
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.formGroup.value),
        map((value: FilterValue) => ({
          portfolioId: value.portfolio.portfolioId,
          currencyId: value.currency.currencyId,
        }))
      )
      .subscribe((params: Params) => {
        this.#dataAccess.params.update((value) => ({ ...value, ...params }));
      });
  }
}
