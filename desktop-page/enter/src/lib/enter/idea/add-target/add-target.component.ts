import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiNumberFormat, TuiTextfield } from '@taiga-ui/core';
import { AddForm } from '../add';
import { TuiAutoFocus, TuiDay, tuiPure } from '@taiga-ui/cdk';
import { getNumberFromE } from 'utils/get-number-from-e';
import { TuiTime } from '@taiga-ui/cdk/date-time';
import { TuiInputDateTime, TuiInputNumber } from '@taiga-ui/kit';

@Component({
	selector: 'lib-add-target-add',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TuiTextfield,
		TuiInputDateTime,
		TuiInputNumber,
		TuiButton,
		TuiAutoFocus,
		TuiNumberFormat,
	],
	templateUrl: './add-target.component.html',
	styleUrls: ['../add.scss', './add-target.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTargetComponent extends AddForm implements OnInit {
	lot = null;
	minPrice = 0;
	maxPrice = null;
	maxAmount = null;
	minDay: [TuiDay | null, TuiTime | null] = [null, null];

	override form = new FormGroup({
		stopDate: new FormControl<[TuiDay, TuiTime] | [null, null]>({ value: [null, null], disabled: true }),
		price: new FormControl({ value: null, disabled: true }, Validators.required),
		amount: new FormControl({ value: null, disabled: true }, Validators.required),
		lots: new FormControl<number | null>({ value: null, disabled: true }, Validators.required),
	});

	@tuiPure
	get numberFromIncrement() {
		return this.minPriceIncrement ?? getNumberFromE(this.minPriceIncrement);
	}

	ngOnInit(): void {
		if (this.context.data) {
			const { amount, price, lot, stopDate, minPriceIncrement, minPrice, maxPrice, maxAmount, minDay } = this.context.data;

			this.form.patchValue({
				amount,
				price,
				lots: lot ? amount / lot : null,
				stopDate: this.getTuiDates(stopDate || null),
			});

			this.lot = lot;
			this.minDay = this._getDateTime(minDay);
			this.maxAmount = maxAmount || null;
			this.minPrice = minPrice || 0;
			this.maxPrice = maxPrice || null;
			this.minPriceIncrement = minPriceIncrement;
			this.precision = this.getPrecision(minPriceIncrement);
		}

		const controlDate = this.form.get('stopDate') as FormControl;

		controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			const { amount, price, stopDate } = this.form.value;
			this.context.completeWith({
				amount,
				price,
				stopDate: stopDate ? this.getISOString(stopDate[0], stopDate[1]) : null,
			});
		}
	}

	private _getDateTime(value: string | null): [TuiDay | null, TuiTime | null] {
		if (value === null) {
			return [null, null];
		}

		const date = new Date(value);

		return [TuiDay.fromLocalNativeDate(date), TuiTime.fromLocalNativeDate(date)];
	}
}
