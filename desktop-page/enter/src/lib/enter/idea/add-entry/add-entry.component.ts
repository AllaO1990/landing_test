import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddForm } from '../add';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiNumberFormat, TuiTextfieldComponent, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { TuiInputDateTimeModule, TuiInputNumberModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiAutoFocus } from '@taiga-ui/cdk';
import { getNumberFromE } from 'utils/get-number-from-e';
import { TuiChevron, TuiDataListWrapperComponent, TuiSelectDirective } from '@taiga-ui/kit';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';

@Component({
	selector: 'lib-add-entry',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		TuiButton,
		TuiInputDateTimeModule,
		TuiInputNumberModule,
		TuiTextfieldControllerModule,
		TuiTextfieldOptionsDirective,
		TuiNumberFormat,
		TuiAutoFocus,
		TuiChevron,
		TuiDataListWrapperComponent,
		TuiSelectDirective,
		TuiTextfieldComponent,
	],
	templateUrl: './add-entry.component.html',
	styleUrls: ['../add.scss', './add-entry.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEntryComponent extends AddForm implements OnInit {
	ngOnInit(): void {
		this.form = new FormGroup({
			date: new FormControl({ value: [null, null], disabled: true }),
			price: new FormControl({ value: null, disabled: true }, Validators.required),
			quantity: new FormControl({ value: null, disabled: true }, Validators.required),
		});

		if (this.context.data) {
			const { date, price, quantity, minPriceIncrement } = this.context.data;

			this.form.patchValue({
				price,
				quantity,
				date: this.getTuiDates(date || null),
			});

			this.minPriceIncrement = minPriceIncrement;
			this.precision = this.getPrecision(minPriceIncrement);
		}

		const controlDate = this.form.get('date') as FormControl;

		controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			const { date, price, quantity } = this.form.value;

			this.context.completeWith({
				...this.context.data,
				date: this.getISOString(date[0], date[1]),
				price,
				quantity,
				totalPrice: price * quantity,
				depositShare: null,
			});
		}
	}

	protected readonly getNumberFromE = getNumberFromE;
	protected readonly positionType = STOCK_POSITION_TYPE_LIST;
}
