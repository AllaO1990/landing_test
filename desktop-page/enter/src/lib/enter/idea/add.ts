import { FormGroup } from '@angular/forms';
import { TuiDay, TuiPopover, TuiTime } from '@taiga-ui/cdk';
import { AfterViewInit, Directive, inject } from '@angular/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';

@Directive()
export class AddForm implements AfterViewInit {
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, { optional: true });
  readonly size = 's';
  form!: FormGroup;

  ngAfterViewInit(): void {
    this.form.enable({ emitEvent: false });
  }

  onCancel(event: Event): void {
    event.preventDefault();

    if (this.context) {
      this.context.completeWith(null);
    }
  }

  getISOString(date: TuiDay | null, time: TuiTime | null): string | null {
    if (date === null || time === null) {
      return null;
    }

    return new Date(date.toLocalNativeDate().valueOf() + time.valueOf()).toISOString();
  }

  getTuiDates(date: string | null): [TuiDay, TuiTime] | [null, null] {
    if (date === null) {
      return [null, null];
    }

    const d = new Date(date);

    return [TuiDay.fromLocalNativeDate(d), TuiTime.fromLocalNativeDate(d)];
  }
}
