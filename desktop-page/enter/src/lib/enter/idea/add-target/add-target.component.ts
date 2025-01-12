import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiInputDateTimeModule, TuiInputNumberModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiButton, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { AddForm } from '../add';
import { TuiAutoFocus } from '@taiga-ui/cdk';

@Component({
  selector: 'lib-add-target-add',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiInputNumberModule,
    TuiTextfieldControllerModule,
    TuiTextfieldOptionsDirective,
    TuiButton,
    TuiNumberFormat,
    TuiAutoFocus,
    TuiInputDateTimeModule,
  ],
  templateUrl: './add-target.component.html',
  styleUrls: ['../add.scss', './add-target.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTargetComponent extends AddForm implements OnInit {
  ngOnInit(): void {
    this.form = new FormGroup({
      stopDate: new FormControl({ value: [null, null], disabled: true }),
      price: new FormControl({ value: null, disabled: true }, Validators.required),
      amount: new FormControl({ value: null, disabled: true }, Validators.required),
    });

    if (this.context.data) {
      const { amount, price, stopDate } = this.context.data;

      this.form.patchValue({
        amount,
        price,
        stopDate: this.getTuiDates(stopDate),
      });
    }
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { amount, price, stopDate } = this.form.value;
      this.context.completeWith({
        amount,
        price,
        stopDate: this.getISOString(stopDate[0], stopDate[1]),
      });
    }
  }
}
