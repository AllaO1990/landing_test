import {AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject} from '@angular/core';
import {TuiDay, TuiPopover, tuiPure, TuiStringHandler, TuiTime} from '@taiga-ui/cdk';
import {POLYMORPHEUS_CONTEXT} from '@taiga-ui/polymorpheus';
import {TuiAppearance, TuiButton, TuiDataList, TuiDataListComponent, TuiScrollbar, TuiTextfield,} from '@taiga-ui/core';
import {AsyncPipe} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TuiTextfieldControllerModule} from '@taiga-ui/legacy';
import {combineLatest, debounceTime, distinctUntilChanged, filter, map, Observable, of, startWith} from 'rxjs';
import {
  TuiChevron,
  TuiDataListDropdownManager,
  TuiDataListWrapper,
  TuiInputDateTime,
  TuiInputNumber,
  TuiSelect,
} from '@taiga-ui/kit';
import {TradeStore} from '@data-access-trade/store.trade';
import {
  TradeOrderType,
  TradeOrderTypeDescription,
  TradeOrderTypesDescription,
  TradeSource,
  TradeSources,
} from '@data-access-trade/types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {getNumberPrecision} from 'utils/get-number-precision';
import {TRADE_EXPIRATION_TYPES} from './request.constants';
import {TuiCard} from '@taiga-ui/layout';
import {endOfWeek} from 'date-fns/endOfWeek';
import {endOfMonth} from 'date-fns/endOfMonth';
import {TradeOrderTypeText, TradeStopOrderTypeText} from '@data-access-trade/order.types';

export interface RequestFormValue {
	direction: boolean;
	orderType: TradeOrderType;
	price: number;
	quantity: number;
	lot: number;
	lots: number;
}

@Component({
	selector: 'trade-request',
	standalone: true,
	imports: [
		TuiButton,
		ReactiveFormsModule,
		TuiDataListComponent,
		TuiTextfieldControllerModule,
		AsyncPipe,
		TuiInputNumber,
		TuiTextfield,
		TuiChevron,
		TuiSelect,
		TuiDataListDropdownManager,
		TuiDataList,
		TuiDataListWrapper,
		TuiInputDateTime,
		TuiCard,
		TuiAppearance,
		TuiScrollbar,
	],
	templateUrl: './request.component.html',
	styleUrls: ['../common/dialog.scss', './request.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestTradeComponent implements AfterViewInit {
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #store: TradeStore = inject(TradeStore);
	readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);
	readonly #today: Date = new Date();

	@tuiPure
	get max(): number | null {
		return (this.#context.data && this.#context.data.max) || null;
	}

	@tuiPure
	get price(): number | null {
		return this.#context.data.price.value || null;
	}

	@tuiPure
	get lastPrice(): number | null {
		return (this.#context.data && this.#context.data.lastPrice.value) || null;
	}

	readonly dates: { name: string; date: [TuiDay, TuiTime] }[] = [
		{
			name: 'До конца дня',
			date: [TuiDay.fromLocalNativeDate(this.#today), new TuiTime(23, 59, 59, 0)],
		},
		{
			name: 'До конца недели',
			date: [TuiDay.fromLocalNativeDate(endOfWeek(this.#today, { weekStartsOn: 1 })), new TuiTime(23, 59, 59, 0)],
		},
		{
			name: 'До конца месяца',
			date: [TuiDay.fromLocalNativeDate(endOfMonth(this.#today)), new TuiTime(23, 59, 59, 0)],
		},
	];
	readonly size = 's';
	readonly formGroup: FormGroup = new FormGroup({
		direction: new FormControl(null, Validators.required),
		orderType: new FormControl(null, Validators.required),
		expirationType: new FormControl({ value: null, disabled: true }, Validators.required),
		expireDate: new FormControl({ value: this.dates[0].date, disabled: true }),
		stopPrice: new FormControl({ value: null, disabled: true }, Validators.required),
		trailingData: new FormGroup({
			indent: new FormControl(1),
			indentType: new FormControl(1),
			spread: new FormControl({ value: null, disabled: true }, Validators.required),
			spreadType: new FormControl(1),
		}),
		price: new FormControl(null, Validators.required),
		quantity: new FormControl({ value: null, disabled: true }, Validators.required),
		lots: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
		lot: new FormControl(null),
		total: new FormControl({ value: null, disabled: true }),
	});

	get controlDirection(): FormControl {
		return this.formGroup.get('direction') as FormControl;
	}

	get controlPrice(): FormControl {
		return this.formGroup.get('price') as FormControl;
	}

	get controlOrderType(): FormControl {
		return this.formGroup.get('orderType') as FormControl;
	}

	get controlLots(): FormControl {
		return this.formGroup.get('lots') as FormControl;
	}

	get controlQuantity(): FormControl {
		return this.formGroup.get('quantity') as FormControl;
	}

	get controlLot(): FormControl {
		return this.formGroup.get('lot') as FormControl;
	}

	get controlExpireDate(): FormControl {
		return this.formGroup.get('expireDate') as FormControl;
	}

	get controlExpirationType(): FormControl {
		return this.formGroup.get('expirationType') as FormControl;
	}

	get controlTotal(): FormControl {
		return this.formGroup.get('total') as FormControl;
	}

	get groupTrailingData(): FormGroup {
		return this.formGroup.get('trailingData') as FormGroup;
	}

	get controlStopPrice(): FormControl {
		return this.formGroup.get('stopPrice') as FormControl;
	}

	get controlSpread(): FormControl {
		return this.groupTrailingData.get('spread') as FormControl;
	}

	types$: Observable<TradeOrderTypesDescription | null> = this.#store.orderTypes$;

	expirationTypes$: Observable<TradeSources> = of(TRADE_EXPIRATION_TYPES);

	actions$: Observable<{ name: string; id: boolean }[]> = of([
		{ name: 'Купить', id: true },
		{ name: 'Продать', id: false },
	]);

	readonly isStopOrderType$: Observable<boolean> = this.controlOrderType.valueChanges.pipe(
		map((value: TradeOrderType | null) => {
			if (value === null) {
				return false;
			}

			return this.#store.isStopOrder(value.type);
		})
	);

	onCancel(event: Event): void {
		event.preventDefault();

		if (this.#context) {
			this.#context.completeWith(null);
		}
	}

	onSave(event: Event): void {
		event.preventDefault();

		if (this.#context) {
			const {
				expireDate: [day, time],
				...value
			} = this.formGroup.getRawValue();
			this.#context.completeWith({
				...value,
				expireDate: this._getDate(day, time).toISOString(),
			});
		}
	}

	ngAfterViewInit(): void {
		if (this.#context && this.#context.data) {
			const {
				data: {
					orderType,
					orderTypeText,
					direction,
					quantity,
					lot,
					price,
					minPriceIncrement,
					lastPrice,
					stopPrice,
					expireDate,
					trailingData,
				},
			} = this.#context;
			const lots = Math.floor(quantity.value / lot.value);
			const stopPriceCalc = stopPrice && stopPrice.value ? stopPrice : price;
			const date = expireDate ? this._getTuiDayTime(expireDate.value) : null;

			this._updateControl(this.controlDirection, direction);
			this._updateControl(this.controlLots, { value: lots, disabled: quantity.disabled });
			this._updateControl(this.controlStopPrice, stopPriceCalc.value ? stopPriceCalc : lastPrice);
			this._updateControl(this.controlPrice, price);
			this._updateControl(this.controlOrderType, { value: { id: orderType, type: orderTypeText }, disabled: false });
			this._updateControl(this.controlLot, lot, { onlySelf: false });
			this._updateControl(this.controlSpread, minPriceIncrement);

			if (date !== null) {
				this._updateControl(this.controlExpireDate, { value: date, disabled: expireDate.disabled });
			}

			if (trailingData && trailingData.value && trailingData.value.spread) {
				this.groupTrailingData.patchValue(trailingData.value);
			}
		}

		this.expirationTypes$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((types: TradeSources) => {
			if (this.controlExpirationType.value === null) {
				this.controlExpirationType.setValue(types[0]);
			}
		});

		this.controlOrderType.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.controlOrderType.value), distinctUntilChanged())
			.subscribe((value: TradeOrderType | null) => {
				if (
					value === null ||
					value.type === TradeOrderTypeText.ORDER_TYPE_MARKET ||
					value.type === TradeOrderTypeText.ORDER_TYPE_BESTPRICE ||
					value.type === TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS
				) {
					this.controlPrice.disable();
					this.controlPrice.patchValue(this.lastPrice);
				} else {
					this.controlPrice.enable();
					this.controlPrice.patchValue(this.price || this.lastPrice);
				}

				if (value && this.#store.isStopOrder(value.type)) {
					this.controlExpirationType.enable();
					this.controlStopPrice.enable();
					this.controlSpread.enable();
				} else {
					this.controlExpirationType.disable();
					this.controlStopPrice.disable();
					this.controlSpread.disable();
				}
			});

		this.controlLots.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.controlLots.value), distinctUntilChanged())
			.subscribe((value: number) => {
				this.controlQuantity.patchValue(value * this.controlLot.value);
			});

		this.controlExpirationType.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlExpirationType.value),
				filter((value: TradeSource | null): value is TradeSource => value !== null),
				map((value: TradeSource) => this._getAction(value.id !== 2)),
				distinctUntilChanged()
			)
			.subscribe((action) => this.controlExpireDate[action]());

		combineLatest([
			this.controlQuantity.valueChanges.pipe(
				startWith(this.controlQuantity.value),
				filter((value: number | null): value is number => value !== null)
			),
			this.controlPrice.valueChanges.pipe(
				startWith(this.controlPrice.value),
				filter((value: number | null): value is number => value !== null)
			),
		])
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				debounceTime(100),
				map(([quantity, price]: [number, number]) => getNumberPrecision(+quantity * +price, 2))
			)
			.subscribe((value) => this.controlTotal.patchValue(value));
	}

	protected stringifySource: TuiStringHandler<TradeSource> = (item: TradeSource) => item.name;

	@tuiPure
	protected stringifyOrderType(items: TradeOrderTypesDescription) {
		return (item: TradeOrderTypeDescription) => {
			const find = items.find((desc: TradeOrderTypeDescription) => desc.type === item.type && desc.id === item.id) || null;
			return find ? find.name : '';
		};
	}

	protected identityMatcherOrderType = (a: TradeOrderType, b: TradeOrderType) => a.id === b.id && a.type === b.type;

	@tuiPure
	protected stringifyActions(items: readonly { name: string; id: boolean }[]): TuiStringHandler<boolean> {
		const map = new Map(items.map(({ name, id }) => [id, name] as [boolean, string]));

		return (value: boolean) => map.get(value) || '';
	}

	@tuiPure
	protected stringifyTypes(items: TradeOrderTypesDescription): TuiStringHandler<number> {
		const map = new Map(items.map(({ name, id }) => [id, name] as [number, string]));

		return (value: number) => map.get(value) || '';
	}

	private _updateControl<T = unknown>(
		control: FormControl,
		controlState: { value: T; disabled: boolean },
		options: {
			onlySelf?: boolean;
			emitEvent?: boolean;
			emitModelToViewChange?: boolean;
			emitViewToModelChange?: boolean;
		} = { onlySelf: true }
	): void {
		control.setValue(controlState.value, options);
		control[controlState.disabled ? 'disable' : 'enable'](options);
	}

	private _getAction(isDisable: boolean): 'disable' | 'enable' {
		return isDisable ? 'disable' : 'enable';
	}

	private _getDate(day: TuiDay, time: TuiTime): Date {
		return new Date(day.toLocalNativeDate().valueOf() + time.valueOf());
	}

	private _getTuiDayTime(dateString: string | null): [TuiDay, TuiTime] | null {
		if (!dateString) {
			return null;
		}

		const date = new Date(dateString);
		return [TuiDay.fromLocalNativeDate(date), TuiTime.fromLocalNativeDate(date)];
	}
}
