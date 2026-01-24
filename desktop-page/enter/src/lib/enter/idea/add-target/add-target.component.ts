import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { AddComponent } from '../add/add.component';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';

type Item = { id: string; name: string };

interface ControlValue {
	total: number | null;
	price: number | null;
	quantity: number | null;
	lots: number | null;
}

export interface FormValue {
	total: number | null;
	price: number | null;
	quantity: number | null;
	lots: number | null;
}

@Component({
	selector: 'lib-add-target-add',
	standalone: true,
	imports: [ReactiveFormsModule, TuiButton, AddComponent],
	templateUrl: './add-target.component.html',
	styleUrls: ['../add.scss', './add-target.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTargetComponent implements OnInit {
	readonly size = 's';
	readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, { optional: true });

	control: FormControl<ControlValue> = new FormControl();

	ngOnInit(): void {
		this.control.valueChanges.subscribe((value) => {
			console.log(this.control);
		});
		// if (this.context.data) {
		// 	const { quantity, price, lot, minPriceIncrement, minPrice, maxPrice, maxAmount, limit } = this.context.data;
		//
		// 	this.form.patchValue({
		// 		quantity,
		// 		price,
		// 		lots: lot ? quantity / lot : null,
		// 		total: price && quantity ? price * quantity : null,
		// 	});
		//
		// 	this.lot = lot || null;
		// 	this.limit = limit || null;
		// 	this.maxAmount = maxAmount || null;
		// 	this.minPrice = minPrice || null;
		// 	this.maxPrice = maxPrice || null;
		// 	this.minPriceIncrement = minPriceIncrement;
		// 	this.precision = this.getPrecision(minPriceIncrement);
		// }
		// this.controlPrice.enable({ emitEvent: false });
		// this.controlLots.enable({ emitEvent: false });
		//
		// this.valueLots$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: number) => {
		// 	this.controlQuantity.setValue(value * (this.lot || 1), { emitEvent: false });
		// });
		//
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			this.context.completeWith(this.control.value);
		}
	}

	onCancel(event: Event): void {
		event.preventDefault();

		if (this.context) {
			this.context.completeWith(null);
		}
	}
}
