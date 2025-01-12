import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddForm } from '../add';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { TuiInputDateTimeModule, TuiInputNumberModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiAutoFocus } from '@taiga-ui/cdk';
import { StockPositionIdeaEntry } from 'types/position';

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
      date: new FormControl({ value: [null, null], disabled: true }),
      price: new FormControl({ value: null, disabled: true }, Validators.required),
      quantity: new FormControl({ value: null, disabled: true }, Validators.required),
    });

    if (this.context.data) {
      const { date, price, quantity } = this.context.data as StockPositionIdeaEntry;

      this.form.patchValue({
        price,
        quantity,
        date: this.getTuiDates(date || new Date().toISOString()),
      });
    }
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { date, price, quantity } = this.form.value;

      this.context.completeWith({
        ...this.context.data,
        date: this.getISOString(date[0], date[1]),
        price,
        quantity,
        totalPrice: price * quantity,
        depositShare: null,
      });
    }
  }
}
