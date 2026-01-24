import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiIcon, TuiNumberFormat, TuiTextfield } from '@taiga-ui/core';
import { AddForm } from '../add';
import { TuiAutoFocus, tuiPure } from '@taiga-ui/cdk';
import { getNumberFromE } from 'utils/get-number-from-e';
import { TuiInputNumber, TuiTooltip } from '@taiga-ui/kit';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, filter, Observable, startWith } from 'rxjs';
import { AddComponent } from '../add/add.component';

export interface FormValue {
	total: number | null;
	price: number | null;
	quantity: number | null;
	lots: number | null;
}

@Component({
	selector: 'lib-add-target-add',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TuiTextfield,
		TuiInputNumber,
		TuiButton,
		TuiAutoFocus,
		TuiNumberFormat,
		TuiIcon,
		TuiTooltip,
		AsyncPipe,
		TuiFormatNumberPipe,
		AddComponent,
	],
	templateUrl: './add-target.component.html',
	styleUrls: ['../add.scss', './add-target.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTargetComponent extends AddForm implements OnInit {
	lot = null;
	limit = null;
	minPrice = 0;
	maxPrice = null;
	maxAmount = null;

	override form: FormGroup = new FormGroup({
		total: new FormControl<number | null>({ value: null, disabled: true }),
		price: new FormControl<number | null>({ value: null, disabled: true }, Validators.required),
		quantity: new FormControl<number | null>({ value: null, disabled: true }, Validators.required),
		lots: new FormControl<number | null>({ value: null, disabled: true }, Validators.required),
	});

	control = new FormControl();

	get controlPrice(): FormControl {
		return this.form.get('price') as FormControl;
	}

	valuePrice$: Observable<number> = this.controlPrice.valueChanges.pipe(
		startWith(this.controlPrice.value),
		filter((value: null | number) => value !== null)
	);

	get controlLots(): FormControl {
		return this.form.get('lots') as FormControl;
	}

	valueLots$: Observable<number> = this.controlLots.valueChanges.pipe(
		startWith(this.controlLots.value),
		filter((value: null | number) => value !== null)
	);

	get controlQuantity(): FormControl {
		return this.form.get('quantity') as FormControl;
	}

	get controlTotal(): FormControl {
		return this.form.get('total') as FormControl;
	}

	@tuiPure
	get numberFromIncrement() {
		return this.minPriceIncrement ?? getNumberFromE(this.minPriceIncrement);
	}

	ngOnInit(): void {
		console.log(this.control);

		this.control.valueChanges.pipe().subscribe((value) => {
			console.log(value, this.control);
		});

		if (this.context.data) {
			const { quantity, price, lot, minPriceIncrement, minPrice, maxPrice, maxAmount, limit } = this.context.data;

			this.form.patchValue({
				quantity,
				price,
				lots: lot ? quantity / lot : null,
				total: price && quantity ? price * quantity : null,
			});

			this.lot = lot || null;
			this.limit = limit || null;
			this.maxAmount = maxAmount || null;
			this.minPrice = minPrice || null;
			this.maxPrice = maxPrice || null;
			this.minPriceIncrement = minPriceIncrement;
			this.precision = this.getPrecision(minPriceIncrement);
		}
		this.controlPrice.enable({ emitEvent: false });
		this.controlLots.enable({ emitEvent: false });

		this.valueLots$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: number) => {
			this.controlQuantity.setValue(value * (this.lot || 1), { emitEvent: false });
		});

		combineLatest([this.valuePrice$, this.valueLots$])
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(([price, lots]: [number, number]) => {
				this.controlTotal.setValue(price * lots * (this.lot || 1), { emitEvent: false });
			});
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			const { quantity, price } = this.form.getRawValue();
			this.context.completeWith({
				quantity,
				price,
			});
		}
	}
}
