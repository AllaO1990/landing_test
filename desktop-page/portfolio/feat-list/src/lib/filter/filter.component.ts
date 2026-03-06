import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	forwardRef,
	inject,
	signal,
} from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { PORTFOLIO_CONSTANTS } from '@data-access-portfolio/constants';
import { AccountCurrency, AccountPortfolio } from 'types/account';
import { filter, Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { ControlPortfolioComponent } from 'ui-common/lib/portfolio';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => FilterPortfolioListComponent),
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPortfolioListComponent implements AfterViewInit, ControlValueAccessor {
	static valueDefaultCurrency = { currency: 'Все', currencySymbol: 'Все', currencyId: null };
	static valueDefaultPortfolio = { portfolio: 'Все', portfolioId: null, edit: false, remove: false };

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

	onChange = (v: any) => {};
	onTouched = () => {};

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

	writeValue(obj: any): void {
		this.formGroup.patchValue(obj);
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.formGroup[isDisabled ? 'disable' : 'enable']();
	}

	ngAfterViewInit(): void {
		this.formGroup.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef))
			.subscribe((value: FilterValue) => this.onChange(value));
	}
}
