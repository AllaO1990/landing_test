import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import {
  TuiInputDateModule,
  TuiInputDateTimeModule,
  TuiInputNumberModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { AddForm } from '../add';
import { TuiAutoFocus, TuiDay } from '@taiga-ui/cdk';

@Component({
  selector: 'lib-add-stop',
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
  templateUrl: './add-stop.component.html',
  styleUrls: ['../add.scss', './add-stop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStopComponent extends AddForm implements OnInit {
  ngOnInit() {
    this.form = new FormGroup({
      stopCandleDate: new FormControl({ value: null, disabled: true }),
      price: new FormControl({ value: null, disabled: true }, Validators.required),
    });

    if (this.context.data) {
      const { price, stopCandleDate } = this.context.data;

      this.form.patchValue({
        price,
        stopCandleDate: stopCandleDate && TuiDay.jsonParse(stopCandleDate.split('T')[0]),
      });
    }
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { price, stopCandleDate } = this.form.value;
      this.context.completeWith({
        price,
        stopCandleDate: stopCandleDate && stopCandleDate.toJSON(),
      });
    }
  }
}
