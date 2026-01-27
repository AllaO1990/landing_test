import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiAppearance, TuiButton, TuiFormatNumberPipe } from '@taiga-ui/core';
import { tuiPure } from '@taiga-ui/cdk';
import { DialogCoreComponent } from '@ui/components/dialog';
import { FormPriceLotsComponent } from 'ui-common/lib/form-price-lots';
import { StockPositionTarget } from 'types/position';
import { distinctUntilChanged, Observable, startWith } from 'rxjs';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { GetCryptoNumberPipe } from '@ui/pipes/get-crypto-number.pipe';
import { HeaderComponent, ItemComponent, UiList, UiListItem } from '@ui/components/list';
import { tap } from 'rxjs/operators';
import { TuiCardLarge } from '@taiga-ui/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
	selector: 'lib-form-price-lots-target',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TuiButton,
		FormPriceLotsComponent,
		AsyncPipe,
		GetCryptoNumberPipe,
		ItemComponent,
		TuiFormatNumberPipe,
		UiList,
		UiListItem,
		HeaderComponent,
		NgTemplateOutlet,
		TuiAppearance,
		TuiCardLarge,
	],
	templateUrl: './add-target.component.html',
	styleUrls: ['../add.scss', './add-target.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTargetComponent extends DialogCoreComponent implements AfterViewInit {
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly itemHeight = 28;
	readonly form: FormGroup = new FormGroup({
		targets: new FormArray([]),
		add: new FormControl<ControlValue | null>(null),
		index: new FormControl(null),
	});

	get formArrayTarget(): FormArray {
		return this.form.get('targets') as FormArray;
	}

	get controlAdd(): FormControl {
		return this.form.get('add') as FormControl;
	}

	get controlIndex(): FormControl {
		return this.form.get('index') as FormControl;
	}

	readonly targets$: Observable<StockPositionTarget[]> = this.formArrayTarget.valueChanges.pipe(
		startWith(this.formArrayTarget.value),
		tap((data) => console.log(data))
	);

	ngAfterViewInit(): void {
		this.controlIndex.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef), distinctUntilChanged())
			.subscribe((index: number | null) => {
				let value = { price: null, lots: null, quantity: null, total: null };

				if (index !== null) {
					value = this.formArrayTarget.value[index];
				}

				this.controlAdd.reset(value);
				this.controlAdd.markAsPristine();
			});

		if (this.context.data) {
			this._initTargets(this.context.data.targets);

			this._initIndex(this.context.data.index);
		}
	}

	@tuiPure
	get options(): null | ControlOptions {
		if (!this.context.data) {
			return null;
		}

		return Object.assign(DEFAULT_OPTIONS, this.context.data);
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			this.context.completeWith(this.formArrayTarget.value);
		}
	}

	newTarget(event: Event): void {
		event.preventDefault();

		this.controlIndex.patchValue(null);
	}

	addTarget(event: Event): void {
		event.preventDefault();

		this.formArrayTarget.setControl(this.formArrayTarget.controls.length, new FormControl(this.controlAdd.value));
		this.controlIndex.patchValue(null);
	}

	changeTarget(event: Event): void {
		event.preventDefault();

		this.formArrayTarget.at(this.controlIndex.value).patchValue(this.controlAdd.value);
	}

	onEdit(event: Event, index: number): void {
		event.preventDefault();

		this.controlIndex.patchValue(index);
	}

	onRemove(event: Event, index: number): void {
		event.preventDefault();

		this.formArrayTarget.removeAt(index);
		this.controlIndex.patchValue(null);
	}

	private _initTargets(list: StockPositionTarget[] | null): void {
		if (!list) {
			return;
		}

		this.formArrayTarget.clear({ emitEvent: false });

		list.forEach((_: StockPositionTarget, index: number) => {
			this.formArrayTarget.setControl(index, new FormControl(), { emitEvent: false });
		});

		this.formArrayTarget.patchValue(list, { onlySelf: true });
	}

	private _initIndex(index: number | null | undefined): void {
		if (index !== null && index !== undefined) {
			this.controlIndex.patchValue(index);
		}
	}
}
