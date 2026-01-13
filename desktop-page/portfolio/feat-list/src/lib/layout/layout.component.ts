import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
	Injector,
	input,
	InputSignal,
	Signal,
	signal,
} from '@angular/core';
import { PORTFOLIO_CONSTANTS } from '@data-access-portfolio/constants';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FilterPortfolioListComponent } from '../filter/filter.component';
import { AsyncPipe } from '@angular/common';
import { TuiButton, TuiFormatNumberPipe, tuiNumberFormatProvider, TuiScrollbar, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapperComponent, TuiSelect, TuiSkeleton } from '@taiga-ui/kit';
import { getListOfRange } from 'utils/get-list-of-range';
import { filter, Observable, of, shareReplay, startWith } from 'rxjs';
import { TuiDayRange } from '@taiga-ui/cdk';
import { DataAccessPortfolioService } from '@data-access-portfolio/data-access.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getParamsFromRange } from 'utils/get-params-from-range';
import { map } from 'rxjs/operators';
import { LoaderComponent } from '@ui/components/loader';
import { AccountBalance, AccountCurrency } from 'types/account';
import { ChartPortfolioButtonDirective } from './layout.directive';
import { PortfolioData, PortfolioParams } from '@data-access-portfolio/types';
import { AccountFacade } from 'stores/facades/account.facade';
import { PortfolioBalanceService } from '@feat-portfolio-balance';
import { DIALOG, DialogService } from '@ui/components/dialog';

interface CalendarRangeItem {
	text: string;
	range: TuiDayRange;
}

interface FormGroupValue {
	calendar: CalendarRangeItem;
	leadToCurrency: AccountCurrency;
}

@Component({
	selector: 'portfolio-layout',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		FilterPortfolioListComponent,
		AsyncPipe,
		TuiFormatNumberPipe,
		TuiButton,
		TuiChevron,
		TuiDataListWrapperComponent,
		TuiTextfield,
		TuiSelect,
		TuiSkeleton,
		LoaderComponent,
		ChartPortfolioButtonDirective,
		TuiScrollbar,
	],
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss',
	providers: [
		tuiNumberFormatProvider({ precision: 2, decimalMode: 'always' }),
		{
			provide: PortfolioBalanceService,
			useFactory: (dialogService: DialogService) => new PortfolioBalanceService(dialogService),
			deps: [DIALOG],
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit {
	readonly #dataAccess: DataAccessPortfolioService = inject(DataAccessPortfolioService);
	readonly #balanceService: PortfolioBalanceService = inject(PortfolioBalanceService);
	readonly #accountFacade: AccountFacade = inject(AccountFacade);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #injector: Injector = inject(Injector);
	readonly #rangeList: CalendarRangeItem[] = getListOfRange(new Date());

	protected readonly size = 's';
	protected readonly constants = PORTFOLIO_CONSTANTS;
	protected readonly valueDefault = {
		calendar: this.#rangeList[0],
		leadToCurrency: {
			currency: 'rub',
			currencyId: 1,
			currencySymbol: '₽',
		},
	};
	protected readonly formGroup: FormGroup = new FormGroup({
		calendar: new FormControl(this.valueDefault.calendar),
		leadToCurrency: new FormControl(this.valueDefault.leadToCurrency),
	});
	protected readonly calendar$: Observable<CalendarRangeItem[]> = of(this.#rangeList);

	data: InputSignal<PortfolioData<AccountBalance>> = input.required();
	readonly isLoaded = computed(() => !this.data().isLoaded);
	readonly isLoading = computed(() => this.data().isLoaded && !this.data().isLoading);
	readonly balance: Signal<AccountBalance | null> = computed(() => this.data().data);

	stringifyCalendar = signal((x: CalendarRangeItem) => x.text);
	identityMatcherCalendar = signal((a: CalendarRangeItem, b: CalendarRangeItem) => a.range === b.range);
	stringifyCurrency = signal((x: AccountCurrency) => x.currencySymbol || '');
	identityMatcherCurrency = signal((a: AccountCurrency, b: AccountCurrency) => a.currencyId === b.currencyId);

	readonly currency$: Observable<AccountCurrency[] | null> = this.#accountFacade.currencies$.pipe(
		filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	ngAfterViewInit(): void {
		this.formGroup.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.formGroup.value),
				map((value: FormGroupValue) => {
					return {
						leadToCurrency: value.leadToCurrency.currency,
						...getParamsFromRange(value.calendar.range),
					};
				})
			)
			.subscribe((value: { from: string | null; to: string | null; leadToCurrency: string | null }) =>
				this.#dataAccess.params.update((params: PortfolioParams | null) => ({ ...params, ...value }))
			);
	}

	openDialogBalance(event: Event): void {
		event.preventDefault();
		let data = {};
		const params = this.#dataAccess.params();

		console.log(this.#dataAccess.params());

		if (params) {
			const { currency, portfolio } = params;
			data = { currency, portfolio };
		}

		this.#balanceService
			.openDialog(this.#injector, {
				data,
			})
			.subscribe(() => {
				this.#dataAccess.params.update((params) => ({ ...params, ...params }));
			});
	}
}
