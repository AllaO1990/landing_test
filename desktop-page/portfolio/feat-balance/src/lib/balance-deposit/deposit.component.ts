import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAutoFocus, TuiDay, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import {
	TuiButton,
	TuiDataList,
	TuiDropdown,
	TuiFormatNumberPipe,
	TuiNumberFormat,
	TuiTextfield,
} from '@taiga-ui/core';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { AccountFacade } from 'stores/facades/account.facade';
import {
	BehaviorSubject,
	combineLatest,
	filter,
	forkJoin,
	Observable,
	shareReplay,
	Subject,
	switchMap,
	tap,
	timer,
} from 'rxjs';
import { DesktopService } from '@desktop-data/desktop-data';
import { DESKTOP_API } from 'tokens/desktop';
import { Params } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Response } from 'types/response';
import { LoaderComponent } from '@ui/components/loader';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiChevron, TuiInputDateTime, TuiInputNumber, TuiSelect, TuiTextarea } from '@taiga-ui/kit';
import { StockId } from 'types/stock';
import { getTuiDayTime } from 'utils/get-tui-day-time';
import { ControlPortfolioComponent } from 'ui-common/lib/portfolio';
import { DialogCoreComponent } from '@ui/components/dialog';

@Component({
	selector: 'portfolio-deposit',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		ControlPortfolioComponent,
		AsyncPipe,
		TuiTextfield,
		TuiChevron,
		TuiDropdown,
		TuiSelect,
		LoaderComponent,
		TuiFormatNumberPipe,
		TuiInputNumber,
		TuiNumberFormat,
		TuiAutoFocus,
		TuiInputDateTime,
		TuiTextarea,
		TuiButton,
		TuiDataList,
	],
	templateUrl: './deposit.component.html',
	styleUrls: ['../dialog/dialog.scss', './deposit.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositComponent extends DialogCoreComponent implements AfterViewInit {
	readonly #api: DesktopService = inject(DESKTOP_API);
	readonly #service: AccountFacade = inject(AccountFacade);
	readonly #updateBalance$: Subject<void> = new BehaviorSubject<void>(undefined);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly portfolios$: Observable<null | AccountPortfolio[]> = this.#service.portfolios$;
	readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$;
	readonly currencies$: Observable<null | AccountCurrency[]> = this.#service.currencies$;
	readonly maxDate = TuiDay.fromLocalNativeDate(new Date());

	@tuiPure
	get label(): string | null {
		return this.context.label || null;
	}

	@tuiPure
	get action(): string | null {
		return this.context.action || null;
	}

	@tuiPure
	get maxValue() {
		return this.context.max;
	}

	readonly form: FormGroup = new FormGroup({
		amount: new FormControl(null, [Validators.required, Validators.min(0.01)]),
		brokerId: new FormControl(null, [Validators.required]),
		currencyId: new FormControl(null, [Validators.required]),
		portfolio: new FormControl(null, [Validators.required]),
		date: new FormControl(getTuiDayTime(new Date().toISOString()), [Validators.required]),
		comment: new FormControl({ value: null, disabled: true }),
	});

	get controlBroker(): FormControl {
		return this.form.get('brokerId') as FormControl;
	}

	get controlCurrency(): FormControl {
		return this.form.get('currencyId') as FormControl;
	}

	get controlPortfolio(): FormControl {
		return this.form.get('portfolio') as FormControl;
	}

	readonly getBalance = (params: Params) =>
		forkJoin([this.#api.getBalancePortfolioBrokerCurrency(params), timer(1000)]).pipe(
			map(([response, _]: [Response<any>, number]) => response.data)
		);

	readonly isLoadValue$: Subject<boolean> = new BehaviorSubject(false);
	readonly value$: Observable<any> = combineLatest([
		this.controlPortfolio.valueChanges.pipe(
			filter((value: null | any): value is any => value !== null),
			distinctUntilChanged()
		),
		this.controlBroker.valueChanges.pipe(
			filter((value: null | any): value is any => value !== null),
			distinctUntilChanged()
		),
		this.controlCurrency.valueChanges.pipe(
			filter((value: null | any): value is any => value !== null),
			distinctUntilChanged()
		),
		this.#updateBalance$.asObservable(),
	]).pipe(
		takeUntilDestroyed(this.#destroyRef),
		tap(() => this.isLoadValue$.next(true)),
		map(([portfolio, brokerId, currencyId]: any[]) => ({ brokerId, currencyId, portfolioId: portfolio.portfolioId })),
		switchMap((params: Params) => this.getBalance(params)),
		tap(() => this.isLoadValue$.next(false)),
		// tap(() => this.form.patchValue({ amount: null })),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	ngAfterViewInit(): void {
		const { amount, portfolio, date, currency, broker } = this.context.data;

		this.form.patchValue({
			date: getTuiDayTime(date || new Date().toISOString()),
			amount: amount || null,
			currencyId: currency ? currency.currencyId : null,
			brokerId: broker ? broker.brokerId : null,
			portfolio,
		});

		if (this.context.data.type === 'edit') {
			this.controlCurrency.disable();
			this.controlBroker.disable();
			this.controlPortfolio.disable();
		}
	}

	onSubmit(event: SubmitEvent) {
		event.preventDefault();

		const { id, type } = this.context.data;
		const source$ = (params: Params) =>
			type === 'deposit'
				? this.#api.addToAccountDeposit(params)
				: ((id: StockId) => this.#api.editAccountTransactions(id, params))(id);
		const { portfolio, comment, date, ...other } = this.form.getRawValue();
		const params = {
			...other,
			date: new Date(date[0].toLocalNativeDate().valueOf() + date[1].valueOf()).toISOString(),
			portfolioId: portfolio.portfolioId,
		};

		source$(params)
			.pipe(takeUntilDestroyed(this.#destroyRef))
			.subscribe((value) => {
				this.context.completeWith(value);
				this.#updateBalance$.next(undefined);
			});
		// this.form.patchValue({ amount: null });
	}

	stringifyBro =
		(items: AccountBroker[]): TuiStringHandler<number> =>
		(id: number | null) => {
			return items.find((item: AccountBroker) => item.brokerId === id)?.broker ?? '';
		};
	stringifyBroker = signal((x: AccountBroker) => x.broker);
	identityMatcherBroker = signal((a: AccountBroker, b: AccountBroker) => a.brokerId === b.brokerId);

	stringifyCurrency =
		(items: AccountCurrency[]): TuiStringHandler<number> =>
		(id: number | null) => {
			return items.find((item: AccountCurrency) => item.currencyId === id)?.currencySymbol ?? '';
		};
	identityMatcherCurrency = signal((a: AccountCurrency, b: AccountCurrency) => a.currencyId === b.currencyId);
}
