import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAppearance, TuiButton } from '@taiga-ui/core';
import { FormPriceLotsComponent } from 'ui-common/lib/form-price-lots';
import { TuiCard } from '@taiga-ui/layout';
import { DialogCoreComponent } from '@ui/components/dialog';
import { tuiPure } from '@taiga-ui/cdk';

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
	@tuiPure
	get options(): null | ControlOptions {
		if (!this.context.data) {
			return null;
		}

		return Object.assign(DEFAULT_OPTIONS, this.context.data);
	}

	readonly form: FormGroup = new FormGroup({
		add: new FormControl(null, Validators.required),
	});

	get controlAdd(): FormControl {
		return this.form.get('add') as FormControl;
	}

	ngAfterViewInit(): void {
		console.log(this.context.data);

		if (this.context.data) {
			const value = this.context.data.stop[this.context.data.index];

			this.controlAdd.patchValue({
				price: value.price,
				quantity: value.amount,
			});
		}
	}

	ngOnInit() {
		console.log(this.context.data);
		// this.form = new FormGroup({
		// 	stopCandleDate: new FormControl({ value: [null, null], disabled: true }),
		// 	price: new FormControl({ value: null, disabled: true }, Validators.required),
		// });
		//
		// if (this.context.data) {
		// 	const { price, stopCandleDate, minPriceIncrement, minPrice, maxPrice, minDay } = this.context.data;
		//
		// 	this.form.patchValue({
		// 		price,
		// 		stopCandleDate: this.getTuiDates(stopCandleDate || null),
		// 	});
		//
		// 	this.minDay = this._getDateTime(minDay);
		// 	this.minPrice = minPrice || 0;
		// 	this.maxPrice = maxPrice || null;
		// 	this.minPriceIncrement = minPriceIncrement;
		// 	this.precision = this.getPrecision(minPriceIncrement);
		// }
		//
		// const controlDate = this.form.get('stopCandleDate') as FormControl;
		//
		// controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			// 	const { price, stopCandleDate } = this.form.value;
			//
			// 	this.context.completeWith({
			// 		price,
			// 		stopCandleDate: this.getISOString(stopCandleDate[0], stopCandleDate[1]),
			// 	});
		}
	}
}
