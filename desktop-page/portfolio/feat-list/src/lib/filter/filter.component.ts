import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { PORTFOLIO_CONSTANTS } from '@data-access-portfolio/constants';
import { AccountCurrency, AccountPortfolio } from 'types/account';
import { filter, Observable, shareReplay, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataAccessPortfolioService } from '@data-access-portfolio/data-access.service';
import { LocalStorage } from 'storage/local.storage';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';
import { ControlPortfolioComponent } from 'ui-common/lib/portfolio';

interface FilterValue {
	portfolio: AccountPortfolio;
	currency: AccountCurrency;
}

@Component({
	selector: 'portfolio-filter',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		AsyncPipe,
		TuiTextfield,
		TuiChevron,
		TuiSelect,
		TuiDataListWrapper,
		ControlPortfolioComponent,
	],
	templateUrl: './filter.component.html',
	styleUrl: './filter.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPortfolioListComponent implements AfterViewInit {
	static valueDefaultCurrency = { currency: 'Все', currencySymbol: 'Все', currencyId: null };
	static valueDefaultPortfolio = { portfolio: 'Все', portfolioId: null, edit: false, remove: false };

	readonly #localStorage: LocalStorage = inject(LOCAL_STORAGE);
	readonly #dataAccess: DataAccessPortfolioService = inject(DataAccessPortfolioService);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #accountFacade: AccountFacade = inject(AccountFacade);

	protected readonly size = 's';
	protected readonly constants = PORTFOLIO_CONSTANTS;
	protected readonly valueDefault = {
		portfolio: FilterPortfolioListComponent.valueDefaultPortfolio,
		currency: { currency: 'rub', currencyId: 1, currencySymbol: '₽' },
	};

	stringifyCurrency = signal((x: AccountCurrency) => x.currencySymbol || '');
	identityMatcherCurrency = signal((a: AccountCurrency, b: AccountCurrency) => a.currencyId === b.currencyId);

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
		portfolio: new FormControl(this.valueDefault.portfolio),
		currency: new FormControl(this.valueDefault.currency),
	});

	ngAfterViewInit(): void {
		this.formGroup.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				tap((value: FilterValue) => this.#localStorage.setItem('lightPortfolioFilter', value))
				// map((value: FilterValue) => ({
				// 	portfolioId: value.portfolio.portfolioId,
				// 	currencyId: value.currency.currencyId,
				// }))
			)
			.subscribe((params: FilterValue) => {
				this.#dataAccess.params.update((value) => ({ ...value, ...params }));
			});

		this._initFormGroupValue();
	}

	private _initFormGroupValue(): void {
		const value = this.#localStorage.getItem('lightPortfolioFilter') || this.valueDefault;

		this.formGroup.setValue(value);
	}
}
