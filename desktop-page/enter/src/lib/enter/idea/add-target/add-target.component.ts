import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiInputDateModule, TuiInputNumberModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiButton, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { AddForm } from '../add';
import { TuiAutoFocus, TuiDay } from '@taiga-ui/cdk';

@Component({
  selector: 'lib-add-target-add',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiInputNumberModule,
    TuiTextfieldControllerModule,
    TuiTextfieldOptionsDirective,
    TuiButton,
    TuiInputDateModule,
    TuiNumberFormat,
    TuiAutoFocus,
  ],
  templateUrl: './add-target.component.html',
  styleUrls: ['../add.scss', './add-target.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTargetComponent extends AddForm implements OnInit {
  ngOnInit(): void {
    this.form = new FormGroup({
      stopDate: new FormControl({ value: null, disabled: true }),
      price: new FormControl({ value: null, disabled: true }, Validators.required),
      amount: new FormControl({ value: null, disabled: true }, Validators.required),
    });

    if (this.context.data) {
      const { amount, price, stopDate } = this.context.data;

      this.form.patchValue({
        amount,
        price,
        stopDate: stopDate && TuiDay.jsonParse(stopDate.split('T')[0]),
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
        stopDate: stopDate && stopDate.toJSON(),
      });
    }
  }
}
