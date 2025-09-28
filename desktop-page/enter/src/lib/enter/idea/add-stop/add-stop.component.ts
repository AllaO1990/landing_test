import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiNumberFormat, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { TuiInputDateTimeModule, TuiInputNumberModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { AddForm } from '../add';
import { TuiAutoFocus, TuiDay } from '@taiga-ui/cdk';
import { getNumberFromE } from 'utils/get-number-from-e';
import { TuiTime } from '@taiga-ui/cdk/date-time';

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
    TuiNumberFormat,
    TuiAutoFocus,
  ],
  templateUrl: './add-stop.component.html',
  styleUrls: ['../add.scss', './add-stop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStopComponent extends AddForm implements OnInit {
  minPrice = 0;
  maxPrice = null;
  minDay: [TuiDay | null, TuiTime | null] = [null, null];

  ngOnInit() {
    this.form = new FormGroup({
      stopCandleDate: new FormControl({ value: [null, null], disabled: true }),
      price: new FormControl({ value: null, disabled: true }, Validators.required),
    });

    if (this.context.data) {
      const { price, stopCandleDate, minPriceIncrement, minPrice, maxPrice, minDay } = this.context.data;

      this.form.patchValue({
        price,
        stopCandleDate: this.getTuiDates(stopCandleDate || null),
      });

      this.minDay = this._getDateTime(minDay);
      this.minPrice = minPrice || 0;
      this.maxPrice = maxPrice || null;
      this.minPriceIncrement = minPriceIncrement;
      this.precision = this.getPrecision(minPriceIncrement);
    }

    const controlDate = this.form.get('stopCandleDate') as FormControl;

    controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.context) {
      const { price, stopCandleDate } = this.form.value;

      this.context.completeWith({
        price,
        stopCandleDate: this.getISOString(stopCandleDate[0], stopCandleDate[1]),
      });
    }
  }

  protected readonly getNumberFromE = getNumberFromE;

  private _getDateTime(value: string | null): [TuiDay, TuiTime] | [null, null] {
    if (value === null) {
      return [null, null];
    }

    const date = new Date(value);

    return [TuiDay.fromLocalNativeDate(date), TuiTime.fromLocalNativeDate(date)];
  }
}
