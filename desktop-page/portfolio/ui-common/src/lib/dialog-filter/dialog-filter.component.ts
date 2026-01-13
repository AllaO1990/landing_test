import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	forwardRef,
	inject,
	signal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { RangeWithListComponent } from 'ui-common/lib/range-with-list/range-with-list.component';
import { TuiButton, TuiDropdown, TuiTextfield } from '@taiga-ui/core';
import { BehaviorSubject, filter, Observable, shareReplay, startWith, Subject, switchMap, take, tap } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Params } from '@angular/router';
import { getListOfRange } from 'utils/get-list-of-range';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';

@Component({
	selector: 'lib-dialog-filter',
	standalone: true,
	imports: [
		TuiTextfield,
		TuiChevron,
		TuiDropdown,
		TuiDataListWrapper,
		ReactiveFormsModule,
		TuiSelect,
		AsyncPipe,
		RangeWithListComponent,
		TuiButton,
	],
	templateUrl: './dialog-filter.component.html',
	styleUrl: './dialog-filter.component.scss',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => DialogFilterComponent),
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogFilterComponent implements ControlValueAccessor, AfterViewInit {
	static defaultValuePortfolio: AccountPortfolio = { portfolio: 'Все', portfolioId: null };
	static defaultValueBroker: AccountBroker = { broker: 'Все', brokerId: null };
	static defaultValueCurrency: AccountCurrency = { currency: 'Все', currencySymbol: 'Все', currencyId: null };

	readonly #service: AccountFacade = inject(AccountFacade);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #filterValue$: Subject<Params> = new BehaviorSubject({});

	stringifyPortfolio = signal((x: AccountPortfolio) => x.portfolio);
	identityMatcherPortfolio = signal((a: AccountPortfolio, b: AccountPortfolio) => a.portfolioId === b.portfolioId);
	stringifyBroker = signal((x: AccountBroker) => x.broker);
	identityMatcherBroker = signal((a: AccountBroker, b: AccountBroker) => a.brokerId === b.brokerId);
	stringifyCurrency = signal((x: AccountCurrency) => x.currencySymbol || '');
	identityMatcherCurrency = signal((a: AccountCurrency, b: AccountCurrency) => a.currencyId === b.currencyId);

	readonly size = 's';
	readonly maxDate = TuiDay.fromLocalNativeDate(new Date());
	readonly portfolios$: Observable<AccountPortfolio[]> = this.#service.portfolios$.pipe(
		filter((list: AccountPortfolio[] | null): list is AccountPortfolio[] => list !== null),
		map((list: AccountPortfolio[]) => [DialogFilterComponent.defaultValuePortfolio, ...list]),
		tap((list: AccountPortfolio[]) => this.controlPortfolio.patchValue(list[0])),
		shareReplay({ bufferSize: 1, refCount: true })
	);
	readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$.pipe(
		filter((list: AccountBroker[] | null): list is AccountBroker[] => list !== null),
		map((list: AccountBroker[]) => [DialogFilterComponent.defaultValueBroker, ...list]),
		tap((list: AccountBroker[]) => this.controlBroker.patchValue(list[0])),
		shareReplay({ bufferSize: 1, refCount: true })
	);
	readonly currencies$: Observable<null | AccountCurrency[]> = this.#service.currencies$.pipe(
		filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
		map((list: AccountCurrency[]) => [DialogFilterComponent.defaultValueCurrency, ...list]),
		tap((list: AccountCurrency[]) => this.controlCurrency.patchValue(list[0])),
		shareReplay({ bufferSize: 1, refCount: true })
	);
	readonly today = new Date(new Date().setUTCHours(12, 0, 0, 0));
	readonly rangeList: { text: string; range: TuiDayRange }[] = getListOfRange(this.today);

	isDisabled = false;

	onChange = (_: any) => {};
	onTouched = () => {};

	readonly form: FormGroup = new FormGroup({
		range: new FormControl(this.rangeList[3].range),
		broker: new FormControl(DialogFilterComponent.defaultValueBroker),
		currency: new FormControl(DialogFilterComponent.defaultValueCurrency),
		portfolio: new FormControl(DialogFilterComponent.defaultValuePortfolio),
	});

	get controlBroker(): FormControl {
		return this.form.get('broker') as FormControl;
	}

	get controlCurrency(): FormControl {
		return this.form.get('currency') as FormControl;
	}

	get controlPortfolio(): FormControl {
		return this.form.get('portfolio') as FormControl;
	}

	readonly isDisabled$: Observable<boolean> = this.form.valueChanges.pipe(
		startWith(this.form.value),
		switchMap((_: Params) =>
			this.#filterValue$
				.asObservable()
				.pipe(map((filter: Params) => JSON.stringify(this.form.value) === JSON.stringify(filter)))
		)
	);

	selectRangeHandler = (item: { text: string; range: TuiDayRange }) => item.range;

	writeValue(obj: any): void {
		this.form.patchValue(obj);
		this.#filterValue$.next(obj);
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.isDisabled = isDisabled;
	}

	ngAfterViewInit(): void {
		this.form.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.form.value),
				filter((value: any) => value['broker'] !== null && value['currency'] !== null && value['portfolio'] !== null),
				take(1)
			)
			.subscribe((value) => {
				this.#filterValue$.next(value);
				this.onChange(value);
			});
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		this.#filterValue$.next(this.form.value);
		this.onChange(this.form.value);
		this.onTouched();
	}

	private _getStartDate(start: number): Date {
		const date = new Date(this.today);
		return new Date(date.setDate(date.getDate() + start));
	}
}
