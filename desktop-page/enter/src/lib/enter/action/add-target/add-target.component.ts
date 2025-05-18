import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  TuiInputDateModule,
  TuiInputDateTimeModule,
  TuiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiButton, TuiDataList, TuiNumberFormat, TuiTextfield, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { AddForm } from '../add';
import { TuiAutoFocus, TuiContext, TuiDay, tuiPure, TuiStringHandler, TuiTime } from '@taiga-ui/cdk';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AccountFacade } from 'stores/facades/account.facade';
import { AccountBroker } from 'types/account';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiDataListWrapper, TuiInputNumberDirective } from '@taiga-ui/kit';
import { StockPositionActionTarget } from 'types/position';
import { getNumberFromE } from 'utils/get-number-from-e';

const completeDateTimeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value.every(Boolean) ? null : { incompleteDateTime: true };

@Component({
  selector: 'lib-add-target-add',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    TuiTextfieldOptionsDirective,
    TuiButton,
    TuiInputDateModule,
    TuiNumberFormat,
    TuiAutoFocus,
    TuiSelectModule,
    TuiDataList,
    TuiDataListWrapper,
    TuiInputDateTimeModule,
    NgIf,
    NgForOf,
    TuiInputNumberDirective,
    TuiTextfield,
  ],
  templateUrl: './add-target.component.html',
  styleUrls: ['../add.scss', './add-target.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTargetComponent extends AddForm implements OnInit {
  readonly #service: AccountFacade = inject(AccountFacade);
  readonly #isShowCommission: Subject<boolean> = new BehaviorSubject(false);

  readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$;
  readonly today = new Date(new Date().setUTCHours(12, 0, 0, 0));
  readonly maxDate = TuiDay.fromLocalNativeDate(this.today);
  readonly isShowCommission$: Observable<boolean> = this.#isShowCommission.asObservable();

  form: FormGroup = new FormGroup({
    date: new FormControl<[TuiDay | null, TuiTime | null]>(
      {
        value: [null, null],
        disabled: true,
      },
      completeDateTimeValidator
    ),
    price: new FormControl<null | number>({ value: null, disabled: true }, Validators.required),
    commission: new FormControl({ value: null, disabled: true }),
    amount: new FormControl<null | number>({ value: null, disabled: true }, Validators.required),
    brokerId: new FormControl<null | AccountBroker>({ value: null, disabled: true }, Validators.required),
  });

  ngOnInit(): void {
    if (this.context.data) {
      const { amount, price, date, brokerId, minPriceIncrement, isNew } = this.context.data;

      isNew && this.#isShowCommission.next(true);

      this.form.patchValue({
        amount: amount || null,
        price: price || null,
        date: this.getTuiDates(date || new Date().toISOString()),
        brokerId: brokerId || null,
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
      const { amount, price, date, brokerId, commission } = this.form.value;

      this.context.completeWith({
        amount,
        price,
        date: this.getISOString(date[0], date[1]),
        brokerId: brokerId || null,
        reached: false,
        totalPrice: amount * price,
        depositShare: null,
        profit: null,
        profitPercent: null,
        commission,
      } as StockPositionActionTarget);
    }
  }

  protected readonly getNumberFromE = getNumberFromE;

  @tuiPure
  protected stringify(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
    const map = new Map(items.map(({ broker, brokerId }) => [brokerId, broker] as [number, string]));

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }
}
