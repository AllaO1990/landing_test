import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAutoFocus, TuiContext, TuiDay, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { TuiButton, TuiDataListComponent, TuiFormatNumberPipe, TuiNumberFormat, TuiTextfield } from '@taiga-ui/core';
import {
	TuiInputDateTimeModule,
	TuiSelectModule,
	TuiTextareaModule,
	TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
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
import { TuiInputNumberDirective } from '@taiga-ui/kit';
import { StockId } from 'types/stock';
import { getTuiDayTime } from 'utils/get-tui-day-time';
import { DialogCoreComponent } from '../dialog/dialog';
import { ControlPortfolioComponent } from 'ui-common/lib/portfolio';

@Component({
	selector: 'portfolio-deposit',
	standalone: true,
	imports: [
		AsyncPipe,
		FormsModule,
		NgForOf,
		NgIf,
		ReactiveFormsModule,
		TuiAutoFocus,
		TuiButton,
		TuiDataListComponent,
		TuiTextfieldControllerModule,
		TuiNumberFormat,
		TuiSelectModule,
		ControlPortfolioComponent,
		TuiFormatNumberPipe,
		LoaderComponent,
		TuiTextareaModule,
		TuiInputNumberDirective,
		TuiTextfield,
		TuiInputDateTimeModule,
		ControlPortfolioComponent,
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
			amount,
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

	@tuiPure
	protected stringifyBroker(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
		const map = new Map(items.map(({ broker, brokerId }) => [brokerId, broker] as [number, string]));

		return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
	}

	@tuiPure
	protected stringifyCurrency(items: readonly AccountCurrency[]): TuiStringHandler<TuiContext<number>> {
		const map = new Map(items.map(({ currencySymbol, currencyId }) => [currencyId, currencySymbol] as [number, string]));

		return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
	}
}
