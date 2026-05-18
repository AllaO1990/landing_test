import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AddForm } from '../add';
import {
	AbstractControl,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	ValidationErrors,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { TuiButton, TuiDataList, TuiNumberFormat, TuiTextfield, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import {
	TuiInputDateModule,
	TuiInputDateTimeModule,
	TuiInputNumberModule,
	TuiSelectModule,
	TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiAutoFocus, TuiContext, TuiDay, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { AccountFacade } from 'stores/facades/account.facade';
import { BehaviorSubject, filter, Observable, Subject, switchMap } from 'rxjs';
import { AccountBroker } from 'types/account';
import { TuiDataListWrapper, TuiInputNumberDirective } from '@taiga-ui/kit';
import { getNumberFromE } from 'utils/get-number-from-e';
import { getNumberPrecision } from 'utils/get-number-precision';
import { StockPositionActionEntry, StockPositionDividend } from 'types/position';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const completeDateTimeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
	control.value.every(Boolean) ? null : { incompleteDateTime: true };

@Component({
	selector: 'lib-form-price-lots-dividend',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		AsyncPipe,
		TuiButton,
		TuiInputDateTimeModule,
		TuiInputNumberModule,
		TuiTextfieldControllerModule,
		TuiTextfieldOptionsDirective,
		TuiInputDateModule,
		TuiNumberFormat,
		TuiAutoFocus,
		TuiSelectModule,
		TuiDataList,
		TuiDataListWrapper,
		TuiInputNumberDirective,
		TuiTextfield,
	],
	templateUrl: './add-dividend.component.html',
	styleUrls: ['../add.scss', './add-dividend.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDividendComponent extends AddForm implements OnInit {
	private readonly _service: AccountFacade = inject(AccountFacade);
	#destroyRef: DestroyRef = inject(DestroyRef);
	#maxAmount$: Subject<{ [key: string]: number }> = new BehaviorSubject<{ [key: string]: number }>({});
	maxAmount: { [key: string]: number } = {};

	readonly brokers$: Observable<null | AccountBroker[]> = this._service.brokers$.pipe(
		filter((list: null | AccountBroker[]): list is AccountBroker[] => list !== null),
		switchMap((brokers: AccountBroker[]) =>
			this.#maxAmount$
				.asObservable()
				.pipe(map((maxAmount: { [key: string]: number }) => this._getBrokerList(brokers, maxAmount)))
		)
	);
	readonly today = new Date(new Date().setUTCHours(12, 0, 0, 0));
	readonly maxDate = TuiDay.fromLocalNativeDate(this.today);

	form: FormGroup = new FormGroup({
		date: new FormControl({ value: [null, null], disabled: true }, completeDateTimeValidator),
		size: new FormControl({ value: null, disabled: true }, Validators.required),
		amount: new FormControl({ value: null, disabled: true }, Validators.required),
		brokerId: new FormControl({ value: null, disabled: true }, Validators.required),
	});

	get controlBroker(): FormControl {
		return this.form.get('brokerId') as FormControl;
	}

	get controlAmount(): FormControl {
		return this.form.get('amount') as FormControl;
	}

	ngOnInit(): void {
		if (this.context.data) {
			const { date, size, amount, brokerId, minPriceIncrement, entry, dividend, lot } = this.context.data;
			let broker = brokerId;
			let quantity = amount;

			this.maxAmount = this._getMaxAmount(entry, dividend);
			this.#maxAmount$.next(this.maxAmount);

			if (!broker && entry && entry.length > 0) {
				const findBroker = Object.keys(this.maxAmount).find((key: string) => this.maxAmount[key]) || null;
				const findIndex = findBroker
					? entry.findIndex((item: StockPositionActionEntry) => '' + item.brokerId === findBroker)
					: 0;

				broker = entry[findIndex].brokerId;
				quantity = findBroker ? this.maxAmount[findBroker] : entry[findIndex].amount;
			}

			this.form.patchValue({
				size: size || null,
				amount: quantity || null,
				date: this.getTuiDates(date || new Date().toISOString()),
				brokerId: broker || null,
			});

			this.minPriceIncrement = minPriceIncrement;
			this.precisionPrice = this.getPrecision(minPriceIncrement);
			this.precisionAmount = this.getPrecision(lot);
		}

		const controlDate = this.form.get('date') as FormControl;

		controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();

		this.controlBroker.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((_) => {
			this.controlAmount.reset(null);
		});
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			const { date, size, amount, brokerId } = this.form.value;

			const entry = this.context.data.entry
				.filter((item: StockPositionActionEntry) => item.brokerId === brokerId)
				.reduce((acc: number, item: StockPositionActionEntry) => (acc += item.price * item.amount), 0);

			this.context.completeWith({
				...this.context.data,
				date: this.getISOString(date[0], date[1]),
				size,
				amount,
				profit: getNumberPrecision(size * amount, 2),
				profitPct: getNumberPrecision(((size * amount) / entry) * 100, 2),
				depositShare: null,
				brokerId: brokerId || null,
			});
		}
	}

	private _getMaxAmount(
		entry: StockPositionActionEntry[],
		dividend: StockPositionDividend[]
	): {
		[key: string]: number;
	} {
		const maxAmount = entry.reduce(
			(acc: { [key: string]: number }, item: StockPositionActionEntry) => ({
				...acc,
				['' + item.brokerId]: item.amount + (acc['' + item.brokerId] || 0),
			}),
			{}
		);

		if (dividend && dividend.length > 0) {
			Object.keys(maxAmount).forEach((key: string) => {
				maxAmount[key] =
					maxAmount[key] +
					dividend.reduce(
						(acc: number, item: StockPositionDividend) => (acc -= '' + item.brokerId === key ? item.amount : 0),
						0
					);
			});
		}

		return maxAmount;
	}

	private _getBrokerList(brokers: AccountBroker[], maxAmount: { [key: string]: number }): AccountBroker[] {
		const list = brokers.filter((item: AccountBroker) => maxAmount['' + item.brokerId]);

		if (list.length !== 0) {
			return list;
		}

		const value = brokers.filter((item: AccountBroker) => '' + item.brokerId === '' + this.controlBroker.value);

		if (value.length !== 0) {
			return value;
		}

		return brokers;
	}

	protected readonly getNumberFromE = getNumberFromE;

	@tuiPure
	protected stringify(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
		const map = new Map(items.map(({ broker, brokerId }) => [brokerId, broker] as [number, string]));

		return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
	}
}
