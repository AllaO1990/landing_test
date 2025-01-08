import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AddForm } from '../add';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiDataList, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import {
  TuiInputDateModule,
  TuiInputDateTimeModule,
  TuiInputNumberModule,
  TuiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiAutoFocus, TuiDay } from '@taiga-ui/cdk';
import { StockPositionEntry } from 'types/position';
import { AccountFacade } from 'stores/facades/account.facade';
import { map, Observable } from 'rxjs';
import { AccountBroker } from 'types/account';
import { TuiDataListWrapper } from '@taiga-ui/kit';

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
  private readonly _defaultBroker: AccountBroker = {
    broker: 'Не выбран',
    brokerId: -1,
  };
  private readonly _service: AccountFacade = inject(AccountFacade);

  readonly brokers$: Observable<null | AccountBroker[]> = this._service.brokers$.pipe(
    map((list: null | AccountBroker[]) => list && [this._defaultBroker, ...list])
  );

  form: FormGroup = new FormGroup({
    date: new FormControl({ value: null, disabled: true }),
    price: new FormControl({ value: null, disabled: true }, Validators.required),
    quantity: new FormControl({ value: null, disabled: true }, Validators.required),
    broker: new FormControl({ value: null, disabled: true }),
  });

  ngOnInit(): void {
    if (this.context.data) {
      const { date, price, quantity, broker } = this.context.data as StockPositionEntry;

      this.form.patchValue({
        price: price || null,
        quantity: quantity || null,
        date: date && TuiDay.jsonParse(date.split('T')[0]),
        broker: broker || null,
      });
    }
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { date, price, quantity, broker } = this.form.value;

      this.context.completeWith({
        ...this.context.data,
        date: date && date.toJSON(),
        price,
        quantity,
        totalPrice: price * quantity,
        depositShare: null,
        broker: broker && broker.brokerId,
      });
    }
  }
}
