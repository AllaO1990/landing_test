import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TuiAppearance, TuiButton, TuiTextfield} from '@taiga-ui/core';
import {TuiAutoFocus, tuiPure} from '@taiga-ui/cdk';
import {TuiChevron, TuiDataListWrapper, TuiSelect} from '@taiga-ui/kit';
import {STOCK_POSITION_TYPE_LIST} from 'constants/stock-position-type';
import {TuiCardLarge} from '@taiga-ui/layout';
import {DialogCoreComponent} from '@ui/components/dialog';
import {FormPriceLotsComponent} from 'ui-common/lib/form-price-lots';

type Item = { id: string; name: string };

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
	selector: 'lib-form-price-lots-entry',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TuiButton,
		TuiTextfield,
		TuiChevron,
		TuiAutoFocus,
		TuiSelect,
		TuiDataListWrapper,
		TuiAppearance,
		TuiCardLarge,
		FormPriceLotsComponent,
	],
	templateUrl: './add-entry.component.html',
	styleUrls: ['../add.scss', './add-entry.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEntryComponent extends DialogCoreComponent implements OnInit {
	readonly positionType: Item[] = STOCK_POSITION_TYPE_LIST;

	readonly stringifyPositionType = (item: Item) => item.name;

	readonly form: FormGroup = new FormGroup({
		add: new FormControl(null, Validators.required),
		positionType: new FormControl(null, Validators.required),
	});

	@tuiPure
	get options(): null | ControlOptions {
		if (!this.context.data) {
			return null;
		}

		return Object.assign(DEFAULT_OPTIONS, this.context.data);
	}

	ngOnInit(): void {
		if (this.context.data) {
			const { date, price, quantity, minPriceIncrement } = this.context.data;

			// this.form.patchValue({
			// 	price,
			// 	quantity,
			// 	date: this.getTuiDates(date || null),
			// });
			//
			// this.minPriceIncrement = minPriceIncrement;
			// this.precision = this.getPrecision(minPriceIncrement);
		}

		// const controlDate = this.form.get('date') as FormControl;
		//
		// controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			const { add, positionType } = this.form.value;

			this.context.completeWith({ positionType, ...add });
		}
	}
}
