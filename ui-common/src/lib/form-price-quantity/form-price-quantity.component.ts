import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	forwardRef,
	inject,
	input,
	InputSignal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
	ControlValueAccessor,
	FormControl,
	FormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
	ReactiveFormsModule,
	ValidationErrors,
	Validators,
} from '@angular/forms';
import { TuiFormatNumberPipe, TuiIcon, TuiNumberFormat, TuiTextfield } from '@taiga-ui/core';
import { TuiAutoFocus } from '@taiga-ui/cdk';
import { TuiInputNumber, TuiTooltip } from '@taiga-ui/kit';
import { combineLatest, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getNumberPrecision } from 'utils/get-number-precision';
import { map } from 'rxjs/operators';
import { getNumberFromE } from 'utils/get-number-from-e';
import { getPriceIncrement } from 'utils/get-price-increment';

export interface FormValue {
	total: number | null;
	price: number | null;
	amount: number | null;
	quantity: number | null;
	lots: number | null;
}

export interface FormOptions {
	lot: null | number;
	limit: null | number;
	minPrice: null | number;
	maxPrice: null | number;
	minQuantity: null | number;
	maxQuantity: null | number;
	minPriceIncrement: number | null;
}

const FORM_OPTIONS: FormOptions = {
	lot: null,
	limit: null,
	minPrice: null,
	maxPrice: null,
	minQuantity: null,
	maxQuantity: null,
	minPriceIncrement: null,
};

@Component({
	selector: 'ui-form-price-quantity',
	templateUrl: './form-price-quantity.component.html',
	styleUrls: ['./form-price-quantity.component.scss'],
	standalone: true,
	imports: [
		AsyncPipe,
		ReactiveFormsModule,
		TuiTextfield,
		TuiAutoFocus,
		TuiInputNumber,
		TuiNumberFormat,
		TuiFormatNumberPipe,
		TuiIcon,
		TuiTooltip,
	],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => FormPriceQuantityComponent),
			multi: true,
		},
		{
			provide: NG_VALIDATORS,
			useExisting: forwardRef(() => FormPriceQuantityComponent),
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPriceQuantityComponent implements ControlValueAccessor, AfterViewInit {
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly size = 's';

	readonly form: FormGroup = new FormGroup({
		total: new FormControl<number | null>({ value: null, disabled: true }),
		price: new FormControl<number | null>({ value: null, disabled: false }, Validators.required),
		lots: new FormControl<number | null>({ value: null, disabled: true }),
		quantity: new FormControl<number | null>({ value: null, disabled: false }, Validators.required),
	});

	get controlPrice(): FormControl {
		return this.form.get('price') as FormControl;
	}

	get controlLots(): FormControl {
		return this.form.get('lots') as FormControl;
	}

	get controlQuantity(): FormControl {
		return this.form.get('quantity') as FormControl;
	}

	get controlTotal(): FormControl {
		return this.form.get('total') as FormControl;
	}

	readonly autoFocus: InputSignal<boolean> = input(false);

	readonly options = input(FORM_OPTIONS, {
		transform: (value: Partial<FormOptions>) => Object.assign(FORM_OPTIONS, value),
	});

	readonly lot = computed(() => this.options().lot);

	readonly limit = computed(() => this.options().limit);

	readonly minPriceIncrement = computed(() => this.options().minPriceIncrement);

	readonly numberFromIncrement = computed(() => {
		const minPriceIncrement = this.options().minPriceIncrement;

		return minPriceIncrement !== null ? getNumberFromE(minPriceIncrement) : null;
	});

	readonly precision = computed(() => {
		const minPriceIncrement = this.options().minPriceIncrement;

		return minPriceIncrement !== null ? getPriceIncrement(minPriceIncrement) : null;
	});

	readonly precisionAmount = computed(() => {
		const lot = this.options().lot;

		return lot !== null ? getPriceIncrement(lot) : 0;
	});

	readonly maxQuantity = computed(() => this.options().maxQuantity);

	readonly maxLots = computed(() => {
		const maxQuantity = this.options().maxQuantity;
		const lot = this.options().lot;

		return maxQuantity !== null ? maxQuantity / (lot || 1) : null;
	});

	readonly minPrice = computed(() => this.options().minPrice);

	readonly maxPrice = computed(() => this.options().maxPrice);

	onChange = (_: unknown) => {};
	onTouched = () => {};

	writeValue(obj: FormValue): void {
		this.form.patchValue(obj && { ...obj, quantity: obj['amount'] || obj['quantity'] });
	}

	registerOnChange(fn: (v: unknown) => unknown): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => unknown): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		const action = isDisabled ? 'disable' : 'enable';

		this.controlPrice[action]();
		this.controlQuantity[action]();
	}

	validate(): ValidationErrors | null {
		return this.form.invalid ? { AddComponent: 'invalid' } : null;
	}

	ngAfterViewInit(): void {
		this.form.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
			this.onChange(this.form.getRawValue());
		});

		this.controlQuantity.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlQuantity.value),
				map((value: number | null) => this._getLots(value))
			)
			.subscribe((value: number | null) => {
				this.controlLots.setValue(value, { emitEvent: false });
			});

		combineLatest([
			this.controlPrice.valueChanges.pipe(startWith(this.controlPrice.value)),
			this.controlQuantity.valueChanges.pipe(startWith(this.controlQuantity.value)),
		])
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				map(([price, lots]: [number | null, number | null]) => this._getTotal(price, lots))
			)
			.subscribe((value: number | null) => {
				this.controlTotal.setValue(value, { emitEvent: false });
			});
	}

	private _getLots(quantity: number | null): number | null {
		return quantity !== null ? getNumberPrecision(quantity / (this.lot() || 1), this.precision() || 0) : null;
	}

	private _getTotal(price: number | null, quantity: number | null): number | null {
		return price !== null && quantity !== null ? getNumberPrecision(price * quantity, 2) : null;
	}
}
