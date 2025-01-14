import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
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
import { TuiButton, TuiDataList, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import {
  TuiInputDateModule,
  TuiInputDateTimeModule,
  TuiInputNumberModule,
  TuiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiAutoFocus, TuiContext, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { AccountFacade } from 'stores/facades/account.facade';
import { Observable } from 'rxjs';
import { AccountBroker } from 'types/account';
import { TuiDataListWrapper } from '@taiga-ui/kit';
import { getNumberFromE } from 'utils/get-number-from-e';

const completeDateTimeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value.every(Boolean) ? null : { incompleteDateTime: true };

@Component({
  selector: 'lib-add-entry',
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
  ],
  templateUrl: './add-entry.component.html',
  styleUrls: ['../add.scss', './add-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEntryComponent extends AddForm implements OnInit {
  private readonly _service: AccountFacade = inject(AccountFacade);

  readonly brokers$: Observable<null | AccountBroker[]> = this._service.brokers$;

  form: FormGroup = new FormGroup({
    date: new FormControl({ value: [null, null], disabled: true }, completeDateTimeValidator),
    price: new FormControl({ value: null, disabled: true }, Validators.required),
    quantity: new FormControl({ value: null, disabled: true }, Validators.required),
    broker: new FormControl({ value: null, disabled: true }, Validators.required),
  });

  ngOnInit(): void {
    if (this.context.data) {
      const { date, price, quantity, broker, minPriceIncrement } = this.context.data;

      this.form.patchValue({
        price: price || null,
        quantity: quantity || null,
        date: this.getTuiDates(date || null),
        broker: broker || null,
      });

      this.minPriceIncrement = minPriceIncrement;
      this.precision = this.getPrecision(minPriceIncrement);
    }

    const controlDate = this.form.get('date') as FormControl;

    controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();

    this.form.valueChanges.subscribe((res) => console.log(res));
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { date, price, quantity, broker } = this.form.value;

      this.context.completeWith({
        ...this.context.data,
        date: this.getISOString(date[0], date[1]),
        price,
        quantity,
        totalPrice: price * quantity,
        depositShare: null,
        broker: broker || null,
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
