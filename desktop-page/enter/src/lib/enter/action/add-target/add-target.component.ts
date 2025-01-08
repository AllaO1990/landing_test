import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
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
import { filter, Observable, take } from 'rxjs';
import { AccountFacade } from 'stores/facades/account.facade';
import { AccountBroker } from 'types/account';
import { AsyncPipe } from '@angular/common';
import { TuiDataListWrapper } from '@taiga-ui/kit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StockPositionTarget } from 'types/position';

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
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _service: AccountFacade = inject(AccountFacade);

  readonly brokers$: Observable<null | AccountBroker[]> = this._service.brokers$;

  form: FormGroup = new FormGroup({
    stopDate: new FormControl<null | TuiDay>({ value: null, disabled: true }),
    price: new FormControl<null | number>({ value: null, disabled: true }, Validators.required),
    amount: new FormControl<null | number>({ value: null, disabled: true }, Validators.required),
    broker: new FormControl<null | AccountBroker>({ value: null, disabled: true }),
  });

  get controlBroker(): FormControl {
    return this.form.get('broker') as FormControl;
  }

  ngOnInit(): void {
    if (this.context.data) {
      const { amount, price, stopDate, broker } = this.context.data;

      this.form.patchValue({
        amount: amount || null,
        price: price || null,
        stopDate: stopDate ? TuiDay.jsonParse(stopDate.split('T')[0]) : TuiDay.fromLocalNativeDate(new Date()),
        broker: broker || null,
      });
    }

    this.brokers$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        filter((list: null | AccountBroker[]): list is AccountBroker[] => list !== null),
        take(1)
      )
      .subscribe(
        (list: AccountBroker[]) => this.controlBroker.value === null && this.controlBroker.patchValue(list[0])
      );
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { amount, price, stopDate, broker } = this.form.value;

      this.context.completeWith({
        amount,
        price,
        stopDate: stopDate && stopDate.toJSON(),
        broker: broker && broker.brokerId,
        reached: false,
        totalPrice: amount * price,
        depositShare: null,
        profit: null,
        profitPercent: null,
      } as StockPositionTarget);
    }
  }
}
