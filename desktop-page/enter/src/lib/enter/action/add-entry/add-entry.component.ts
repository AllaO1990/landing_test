import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {AsyncPipe, CommonModule} from '@angular/common';
import {AddForm} from '../add';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {TuiButton, TuiDataList, TuiNumberFormat, TuiTextfield, TuiTextfieldOptionsDirective} from '@taiga-ui/core';
import {
  TuiInputDateModule,
  TuiInputDateTimeModule,
  TuiInputNumberModule,
  TuiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import {TuiAutoFocus, TuiContext, TuiDay, tuiPure, TuiStringHandler} from '@taiga-ui/cdk';
import {AccountFacade} from 'stores/facades/account.facade';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {AccountBroker} from 'types/account';
import {TuiDataListWrapper, TuiInputNumber} from '@taiga-ui/kit';
import {getNumberFromE} from 'utils/get-number-from-e';
import {getNumberPrecision} from 'utils/get-number-precision';

const completeDateTimeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
	control.value.every(Boolean) ? null : { incompleteDateTime: true };

@Component({
	selector: 'lib-form-price-lots-entry',
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
		TuiTextfield,
		TuiInputNumber,
	],
	templateUrl: './add-entry.component.html',
	styleUrls: ['../add.scss', './add-entry.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEntryComponent extends AddForm implements OnInit {
	private readonly _service: AccountFacade = inject(AccountFacade);
	readonly #isShowCommission: Subject<boolean> = new BehaviorSubject(false);

	readonly brokers$: Observable<null | AccountBroker[]> = this._service.brokers$;
	readonly today = new Date(new Date().setUTCHours(12, 0, 0, 0));
	readonly maxDate = TuiDay.fromLocalNativeDate(this.today);
	readonly isShowCommission$: Observable<boolean> = this.#isShowCommission.asObservable();

	form: FormGroup = new FormGroup({
		date: new FormControl({ value: [null, null], disabled: true }, completeDateTimeValidator),
		price: new FormControl({ value: null, disabled: true }, Validators.required),
		amount: new FormControl({ value: null, disabled: true }, Validators.required),
		commission: new FormControl({ value: null, disabled: true }),
		brokerId: new FormControl({ value: null, disabled: true }, Validators.required),
	});

	ngOnInit(): void {
		if (this.context.data) {
			const { date, price, amount, brokerId, minPriceIncrement, isNew, lot } = this.context.data;

			isNew && this.#isShowCommission.next(true);

			this.form.patchValue({
				price: price || null,
				amount: amount || null,
				date: this.getTuiDates(date || new Date().toISOString()),
				brokerId: brokerId || null,
			});

			this.minPriceIncrement = minPriceIncrement;
			this.precisionPrice = this.getPrecision(minPriceIncrement);
			this.precisionAmount = this.getPrecision(lot);
		}

		const controlDate = this.form.get('date') as FormControl;

		controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			const { date, price, amount, brokerId, commission } = this.form.value;

			this.context.completeWith({
				...this.context.data,
				date: this.getISOString(date[0], date[1]),
				price,
				amount,
				commission,
				totalPrice: getNumberPrecision(price * amount, 2),
				depositShare: null,
				brokerId: brokerId || null,
			});
		}
	}

	protected readonly getNumberFromE = getNumberFromE;

	@tuiPure
	protected stringify(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
		const map = new Map(items.map(({ broker, brokerId }) => [brokerId, broker] as [number, string]));

		return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
	}
}
