import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAppearance, TuiButton, TuiDataList, TuiTextfield } from '@taiga-ui/core';
import { TuiAutoFocus, tuiPure } from '@taiga-ui/cdk';
import { TuiChevron, TuiSelect } from '@taiga-ui/kit';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';
import { TuiCardLarge } from '@taiga-ui/layout';
import { DialogCoreComponent } from '@ui/components/dialog';
import { FormPriceLotsComponent } from 'ui-common/lib/form-price-lots';
import { StockPositionDirection } from 'types/stock';
import { StockPositionIdeaEntry } from 'types/position';
import { FormPriceQuantityComponent } from 'ui-common/lib/form-price-quantity';

type Item = { id: string; name: string };

interface ContextData {
	positionType?: StockPositionDirection | null;
	index?: number | null;
	entries?: StockPositionIdeaEntry[];
	type?: string;
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
	selector: 'lib-form-price-lots-entry',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TuiButton,
		TuiTextfield,
		TuiChevron,
		TuiAutoFocus,
		TuiSelect,
		TuiAppearance,
		TuiCardLarge,
		FormPriceLotsComponent,
		TuiDataList,
		FormPriceQuantityComponent,
	],
	templateUrl: './add-entry.component.html',
	styleUrls: ['../add.scss', './add-entry.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEntryComponent extends DialogCoreComponent implements AfterViewInit {
	readonly positionType: Item[] = STOCK_POSITION_TYPE_LIST;
	readonly stringifyPositionType = (list: Item[]) => (id: string) =>
		list.find((item: Item) => item.id === id)?.name ?? '';

	readonly form: FormGroup = new FormGroup({
		add: new FormControl(null, Validators.required),
		positionType: new FormControl(null, Validators.required),
	});

	type: string | null = null;

	@tuiPure
	get options(): null | ControlOptions {
		if (!this.context.data) {
			return null;
		}

		return Object.assign(DEFAULT_OPTIONS, this.context.data);
	}

	ngAfterViewInit(): void {
		if (this.context.data) {
			this._initForm(this.context.data);
		}
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			const { add, positionType } = this.form.value;

			this.context.completeWith({ positionType, ...add });
		}
	}

	private _initForm(data: ContextData): void {
		const { positionType, index, entries, type } = data;

		this.type = type || null;

		let value = {};

		if (index !== null && index !== undefined && entries) {
			value = {
				...entries[index],
				total: entries[index].totalPrice,
			};
		}

		this.form.patchValue({
			positionType,
			add: value,
		});
	}
}
