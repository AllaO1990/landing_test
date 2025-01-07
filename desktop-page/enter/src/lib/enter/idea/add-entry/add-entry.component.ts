import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddForm } from '../add';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import {
  TuiInputDateModule,
  TuiInputDateTimeModule,
  TuiInputNumberModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiAutoFocus, TuiDay } from '@taiga-ui/cdk';
import { StockPositionEntry } from 'types/position';

@Component({
  selector: 'lib-add-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiButton,
    TuiInputDateTimeModule,
    TuiInputNumberModule,
    TuiTextfieldControllerModule,
    TuiTextfieldOptionsDirective,
    TuiInputDateModule,
    TuiNumberFormat,
    TuiAutoFocus,
  ],
  templateUrl: './add-entry.component.html',
  styleUrls: ['../add.scss', './add-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEntryComponent extends AddForm implements OnInit {
  ngOnInit(): void {
    this.form = new FormGroup({
      // date: new FormControl({ value: null, disabled: true }),
      price: new FormControl({ value: null, disabled: true }, Validators.required),
      quantity: new FormControl({ value: null, disabled: true }, Validators.required),
    });

    if (this.context.data) {
      const { date, price, quantity } = this.context.data as StockPositionEntry;

      this.form.patchValue({
        price,
        quantity,
        date: date && TuiDay.jsonParse(date.split('T')[0]),
      });
    }
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { date, price, quantity } = this.form.value;

      this.context.completeWith({
        ...this.context.data,
        date: date && date.toJSON(),
        price,
        quantity,
        totalPrice: price * quantity,
        depositShare: null,
      });
    }
  }
}
