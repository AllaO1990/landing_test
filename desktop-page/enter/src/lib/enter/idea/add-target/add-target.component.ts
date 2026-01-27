import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiAppearance, TuiButton, TuiFormatNumberPipe, TuiNotification } from '@taiga-ui/core';
import { tuiPure } from '@taiga-ui/cdk';
import { DialogCoreComponent } from '@ui/components/dialog';
import { FormPriceLotsComponent } from 'ui-common/lib/form-price-lots';
import { StockPositionIdeaEntry, StockPositionTarget } from 'types/position';
import { distinctUntilChanged, Observable, shareReplay, startWith } from 'rxjs';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { GetCryptoNumberPipe } from '@ui/pipes/get-crypto-number.pipe';
import { HeaderComponent, ItemComponent, UiList, UiListItem } from '@ui/components/list';
import { TuiCardLarge } from '@taiga-ui/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getNumberPrecision } from 'utils/get-number-precision';
import { getPriceIncrement } from 'utils/get-price-increment';
import { map } from 'rxjs/operators';

interface ControlValue {
	total: number | null;
	price: number | null;
	quantity: number | null;
	lots: number | null;
}

interface ControlTrustValue {
	total: number;
	price: number;
	quantity: number;
	lots: number;
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
		TuiNotification,
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
		startWith(this.formArrayTarget.value)
	);

	readonly isDisabledSave$: Observable<boolean> = this.targets$.pipe(
		map((value: StockPositionTarget[]) =>
			value.reduce((acc: number, item: StockPositionTarget) => (acc += item.amount), 0)
		),
		distinctUntilChanged(),
		map((value: number) => value === 0 || value !== this.totalEntryQuantity()),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	@tuiPure
	get options(): null | ControlOptions {
		if (!this.context.data) {
			return null;
		}

		return Object.assign(DEFAULT_OPTIONS, this.context.data);
	}

	@tuiPure
	totalEntryQuantity(): number {
		return this.context.data.entries.reduce((acc: number, item: StockPositionIdeaEntry) => (acc += item.quantity), 0);
	}

	@tuiPure
	get multiplier(): number {
		return this.context.data.positionType === 'long' ? 1 : -1;
	}

	@tuiPure
	get precision(): number {
		return getPriceIncrement(this.context.data.minPriceIncrement);
	}

	@tuiPure
	get averagePrice(): number {
		return this._getAveragePrice(this.context.data.entries);
	}

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

		const index = this.formArrayTarget.controls.length;

		this.formArrayTarget.setControl(index, new FormControl(this._createTarget(this.controlAdd.value)));
		this.controlIndex.patchValue(index);
		this.controlAdd.markAsPristine();
	}

	changeTarget(event: Event): void {
		event.preventDefault();

		this.formArrayTarget.at(this.controlIndex.value).patchValue(this._createTarget(this.controlAdd.value));
		this.controlAdd.markAsPristine();
	}

	onEdit(event: Event, index: number): void {
		event.preventDefault();

		this.controlIndex.patchValue(index);
	}

	onRemove(event: Event, index: number): void {
		event.preventDefault();

		if (this.controlIndex.value === index) {
			this.controlIndex.patchValue(null);
		}

		this.formArrayTarget.removeAt(index);
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

	private _getAveragePrice(entries: StockPositionIdeaEntry[]): number {
		const totalEntry = entries.reduce(
			(acc, item: StockPositionIdeaEntry) => {
				acc.total += item.totalPrice;
				acc.quantity += item.quantity;

				return acc;
			},
			{ total: 0, quantity: 0 }
		);

		return getNumberPrecision(totalEntry.total / totalEntry.quantity, this.precision);
	}

	private _createTarget(value: ControlTrustValue): StockPositionTarget {
		return {
			price: value.price,
			amount: value.quantity,
			lots: value.lots,
			totalPrice: value.total,
			profit: getNumberPrecision((value.price - this.averagePrice) * value.quantity * this.multiplier, 2),
			profitPercent: getNumberPrecision(
				((100 * (value.price - this.averagePrice)) / this.averagePrice) * this.multiplier,
				2
			),
			depositShare: null,
			reached: false,
			stopDate: null,
			broker: null,
		};
	}
}
