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
  TuiInputNumberModule,
  TuiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiButton, TuiDataList, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { AddForm } from '../add';
import { TuiAutoFocus, TuiDay, TuiTime } from '@taiga-ui/cdk';
import { Observable } from 'rxjs';
import { AccountFacade } from 'stores/facades/account.facade';
import { AccountBroker } from 'types/account';
import { AsyncPipe, NgIf } from '@angular/common';
import { TuiDataListWrapper } from '@taiga-ui/kit';
import { StockPositionTarget } from 'types/position';
import { getNumberFromE } from 'utils/get-number-from-e';

const completeDateTimeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value.every(Boolean) ? null : { incompleteDateTime: true };

@Component({
  selector: 'lib-add-target-add',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TuiInputNumberModule,
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
  ],
  templateUrl: './add-target.component.html',
  styleUrls: ['../add.scss', './add-target.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTargetComponent extends AddForm implements OnInit {
  private readonly _service: AccountFacade = inject(AccountFacade);

  readonly brokers$: Observable<null | AccountBroker[]> = this._service.brokers$;

  form: FormGroup = new FormGroup({
    stopDate: new FormControl<[TuiDay | null, TuiTime | null]>(
      {
        value: [null, null],
        disabled: true,
      },
      completeDateTimeValidator
    ),
    price: new FormControl<null | number>({ value: null, disabled: true }, Validators.required),
    amount: new FormControl<null | number>({ value: null, disabled: true }, Validators.required),
    broker: new FormControl<null | AccountBroker>({ value: null, disabled: true }, Validators.required),
  });

  ngOnInit(): void {
    if (this.context.data) {
      const { amount, price, stopDate, broker, minPriceIncrement } = this.context.data;

      this.form.patchValue({
        amount: amount || null,
        price: price || null,
        stopDate: this.getTuiDates(stopDate || null),
        broker: broker || null,
      });

      this.minPriceIncrement = minPriceIncrement;
      this.precision = this.getPrecision(minPriceIncrement);
    }

    const controlDate = this.form.get('stopDate') as FormControl;

    controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { amount, price, stopDate, broker } = this.form.value;

      this.context.completeWith({
        amount,
        price,
        stopDate: this.getISOString(stopDate[0], stopDate[1]),
        broker: broker && broker.brokerId,
        reached: false,
        totalPrice: amount * price,
        depositShare: null,
        profit: null,
        profitPercent: null,
      } as StockPositionTarget);
    }
  }

  protected readonly getNumberFromE = getNumberFromE;
}
