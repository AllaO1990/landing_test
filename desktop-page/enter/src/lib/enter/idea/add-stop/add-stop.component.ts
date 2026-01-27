import {AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TuiAppearance, TuiButton} from '@taiga-ui/core';
import {FormPriceLotsComponent} from 'ui-common/lib/form-price-lots';
import {TuiCard} from '@taiga-ui/layout';
import {DialogCoreComponent} from '@ui/components/dialog';
import {tuiPure} from '@taiga-ui/cdk';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {StockPositionStop} from 'types/position';
import {debounceTime} from 'rxjs';

interface ControlValue {
	total: number | null;
	price: number | null;
	quantity: number | null;
	lots: number | null;
}

export interface ControlOptions {
	lot: null | number;
	limit: null | number;
	minPrice: null | number;
	maxPrice: null | number;
	minQuantity: null | number;
	maxQuantity: null | number;
	minPriceIncrement: number | null;
}

const DEFAULT_OPTIONS: ControlOptions = {
	lot: null,
	limit: null,
	minPrice: null,
	maxPrice: null,
	minQuantity: null,
	maxQuantity: null,
	minPriceIncrement: null,
};

@Component({
	selector: 'lib-form-price-lots-stop',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, TuiButton, TuiAppearance, FormPriceLotsComponent, TuiCard],
	templateUrl: './add-stop.component.html',
	styleUrls: ['../add.scss', './add-stop.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStopComponent extends DialogCoreComponent implements AfterViewInit {
	#destroyRef: DestroyRef = inject(DestroyRef);

	@tuiPure
	get options(): null | ControlOptions {
		if (!this.context.data) {
			return null;
		}

		return Object.assign(DEFAULT_OPTIONS, this.context.data);
	}

	readonly form: FormGroup = new FormGroup({
		stop: new FormArray<FormControl<StockPositionStop>>([new FormControl()]),
		add: new FormControl<ControlValue | null>(null, Validators.required),
	});

	get controlAdd(): FormControl {
		return this.form.get('add') as FormControl;
	}

	get formArrayStop(): FormArray {
		return this.form.get('stop') as FormArray;
	}

	ngAfterViewInit(): void {
		this.controlAdd.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(150))
			.subscribe((value: ControlValue) => {
				this.formArrayStop.patchValue([
					{
						...this.formArrayStop.value[0],
						amount: value.quantity,
						price: value.price,
						totalPrice: value.total,
						lots: value.lots,
					},
				]);
			});

		if (this.context.data) {
			const stop = this.context.data.stop;
			const value = stop[this.context.data.index];

			this.formArrayStop.patchValue(stop);

			this.controlAdd.patchValue({
				price: value.price,
				quantity: value.amount,
				total: value.totalPrice,
				lots: value.lots,
			});
		}
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			this.context.completeWith(this.formArrayStop.value);
		}
	}
}
