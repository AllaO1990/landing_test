import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TuiInputDateModule,
  TuiInputNumberModule,
  TuiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiButton, TuiDataList, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { AddForm } from '../add';
import { TuiAutoFocus, TuiDay } from '@taiga-ui/cdk';
import { map, Observable } from 'rxjs';
import { AccountFacade } from 'stores/facades/account.facade';
import { AccountBroker } from 'types/account';
import { AsyncPipe } from '@angular/common';
import { TuiDataListWrapper } from '@taiga-ui/kit';

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
  ],
  templateUrl: './add-target.component.html',
  styleUrls: ['../add.scss', './add-target.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTargetComponent extends AddForm implements OnInit {
  private readonly _defaultBroker: AccountBroker = {
    broker: 'Не выбран',
    brokerId: -1,
  };
  private readonly _service: AccountFacade = inject(AccountFacade);

  readonly brokers$: Observable<null | AccountBroker[]> = this._service.brokers$.pipe(
    map((list: null | AccountBroker[]) => list && [this._defaultBroker, ...list])
  );

  ngOnInit(): void {
    this.form = new FormGroup({
      stopDate: new FormControl({ value: null, disabled: true }),
      price: new FormControl({ value: null, disabled: true }, Validators.required),
      amount: new FormControl({ value: null, disabled: true }, Validators.required),
      broker: new FormControl({ value: null, disabled: true }),
    });

    if (this.context.data) {
      const { amount, price, stopDate, broker } = this.context.data;

      this.form.patchValue({
        amount,
        price,
        stopDate: stopDate ? TuiDay.jsonParse(stopDate.split('T')[0]) : TuiDay.fromLocalNativeDate(new Date()),
        broker: broker ? broker : this._defaultBroker,
      });
    }
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { amount, price, stopDate, broker } = this.form.value;
      this.context.completeWith({
        amount,
        price,
        stopDate: stopDate && stopDate.toJSON(),
        broker: broker === -1 ? null : broker.brokerId,
      });
    }
  }
}
