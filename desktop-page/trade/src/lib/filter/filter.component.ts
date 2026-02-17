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
import {
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	Observable,
	of,
	pairwise,
	startWith,
	switchMap,
	take,
	tap,
	timer,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeStore } from '@data-access-trade/store.trade';
import { TradeAccount, TradeOrders, TradeSource, TradeSources, TradeToken } from '@data-access-trade/types';
import { StockInstrument, WithLastPrice } from 'types/stock';
import { Charge } from 'types/response';
import { Params } from '@angular/router';
import { StockPosition } from 'types/position';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';
import { TuiFormatNumberPipe, TuiHint, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiChip, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { LoaderComponent } from '@ui/components/loader';
import { TokenButtonComponent } from '@feat-trade-token';
import { TuiCurrencyPipe } from '@taiga-ui/addon-commerce';
import { TradeBrokerAccounts, TradeBrokerStore, TradeBrokerToken } from '@data-access-trade/store.broker';
import { TIMER_INTERVAL } from 'tokens/desktop/timer-interval';

@Component({
	selector: 'trade-filter',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TuiTextfield,
		TuiChevron,
		TuiSelect,
		TuiDataListWrapper,
		AsyncPipe,
		TuiChip,
		TuiHint,
		LoaderComponent,
		TokenButtonComponent,
		TuiFormatNumberPipe,
		UpperCasePipe,
		TuiCurrencyPipe,
	],
	templateUrl: './filter.component.html',
	styleUrl: './filter.component.scss',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => FilterComponent),
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements ControlValueAccessor, AfterViewInit {
	readonly #localStorage = inject(LOCAL_STORAGE);
	readonly #timerInterval: number = inject(TIMER_INTERVAL);
	readonly #store: TradeStore = inject(TradeStore);
	readonly #storeBroker: TradeBrokerStore = inject(TradeBrokerStore);
	readonly #idea: IdeaFacade = inject(IdeaFacade);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	#onChange = (_: any) => {};
	#onTouched = () => {};

	readonly size = 's';
	readonly idea$: Observable<StockPosition> = this.#idea.idea$;
	readonly accounts$: Observable<TradeBrokerAccounts> = this.#storeBroker.accounts$.pipe(
		tap((data: TradeBrokerAccounts) => data.data && this.controlAccount.setValue(data.data[0]))
	);
	readonly token$: Observable<TradeBrokerToken> = this.#storeBroker.token$;
	readonly sources$: Observable<TradeSources> = this.#storeBroker.source$.pipe(
		map((data: Charge<TradeSources>) => data.data),
		filter((data: TradeSources | null): data is TradeSources => data !== null)
	);
	readonly formGroup: FormGroup = new FormGroup({
		instrument: new FormControl<StockInstrument | null>(null),
		source: new FormControl<TradeSource | null>(null),
		token: new FormControl<TradeToken | null>(null),
		account: new FormControl<TradeAccount | null>(null),
		lastPrice: new FormControl<WithLastPrice | null>(null),
	});

	get controlInstrument(): FormControl {
		return this.formGroup.get('instrument') as FormControl;
	}

	get controlSource(): FormControl {
		return this.formGroup.get('source') as FormControl;
	}

	get controlToken(): FormControl {
		return this.formGroup.get('token') as FormControl;
	}

	get controlAccount(): FormControl {
		return this.formGroup.get('account') as FormControl;
	}

	get controlLastPrice(): FormControl {
		return this.formGroup.get('lastPrice') as FormControl;
	}

	readonly stringifySource = signal((x: TradeSource) => x.name || '');
	readonly identityMatcherSource = signal((a: TradeSource, b: TradeSource) => a.id === b.id);
	readonly stringifyAccount = signal((x: TradeAccount) => x.name || '');
	readonly identityMatcherAccount = signal((a: TradeAccount, b: TradeAccount) => a.accountId === b.accountId);

	isDisabled = false;

	writeValue(obj: any): void {
		this.formGroup.patchValue(obj);
	}

	registerOnChange(fn: any): void {
		this.#onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.#onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		if (this.isDisabled !== isDisabled) {
			this.formGroup[isDisabled ? 'disable' : 'enable']();
		}

		this.isDisabled = isDisabled;
	}

	ngAfterViewInit(): void {
		this.formGroup.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.formGroup.value))
			.subscribe((value) => {
				this.#onChange(value);
				this.#localStorage.setItem('filterTrade', value);
			});

		this.#storeBroker.loadSources();

		this.idea$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				distinctUntilChanged((a, b) => a.idea.id === b.idea.id)
			)
			.subscribe((position: StockPosition) => this.controlInstrument.patchValue(position.idea.instrument));

		this.#idea.lastPrice$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				distinctUntilChanged((a: WithLastPrice | null, b: WithLastPrice | null) => !!(a && b && a.last === b.last))
			)
			.subscribe((value: null | WithLastPrice) => this.controlLastPrice.patchValue(value));

		this.#idea.loadLastPrice(
			this.#idea.instrument$.pipe(
				takeUntilDestroyed(this.#destroyRef),
				switchMap((instrument: StockInstrument | null) => {
					if (instrument === null) {
						return of(null);
					}

					return timer(0, this.#timerInterval).pipe(
						takeUntilDestroyed(this.#destroyRef),
						map(() => instrument.id)
					);
				})
			)
		);

		combineLatest([
			this.formGroup.valueChanges.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.formGroup.value),
				map((value) => ({
					sourceId: value.source && value.source.id,
					accountId: value.account && value.account.accountId,
					instrumentId: value.instrument && value.instrument.id,
				})),
				filter((value) => value.accountId !== null && value.instrumentId !== null && value.sourceId !== null),
				distinctUntilChanged(this._distinct)
			),
			this.#store.orders$.pipe(filter((orders: TradeOrders | null) => orders !== null)),
		])
			.pipe(
				debounceTime(100),
				takeUntilDestroyed(this.#destroyRef),
				map(([value]) => value)
			)
			.subscribe((params: Params) => {
				this.#store.loadPortfolio(params);
			});

		this.controlSource.valueChanges
			.pipe(
				startWith(this.controlSource.value),
				takeUntilDestroyed(this.#destroyRef),
				filter((value: TradeSource | null): value is TradeSource => value !== null),
				map((value: TradeSource) => value.id),
				distinctUntilChanged()
			)
			.subscribe((id: number) => {
				this.#storeBroker.loadToken(id);
			});

		this.sources$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter((list: TradeSources) => list && list.length > 0),
				take(1)
			)
			.subscribe((list: TradeSources) => this.controlSource.setValue(list[0]));

		this.token$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				pairwise(),
				map(([first, second]: [TradeBrokerToken, TradeBrokerToken]) => {
					if ((first !== null && second === null) || (second && second.data === null)) {
						this.#storeBroker.updateAccounts({
							data: null,
							message: 'Не добавлен токен источника tinkoff',
						});
					}

					if ((first === null || first.data === null) && second !== null && second.data !== null) {
						this.#storeBroker.loadAccounts(second.data.sourceId);
					}
					return second;
				})
			)
			.subscribe((value: TradeBrokerToken) => this.controlToken.setValue(value && value.data));
	}

	private _distinct(
		a: { accountId: string; instrumentId: string; sourceId: string },
		b: { accountId: string; instrumentId: string; sourceId: string }
	): boolean {
		return a.accountId === b.accountId && a.instrumentId === b.instrumentId && a.sourceId === b.sourceId;
	}
}
