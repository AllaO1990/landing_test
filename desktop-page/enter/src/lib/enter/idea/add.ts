import { FormControl, FormGroup } from '@angular/forms';
import { TuiDay, TuiPopover, TuiTime } from '@taiga-ui/cdk';
import { AfterViewInit, DestroyRef, Directive, inject } from '@angular/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { filter, Observable, pairwise, pipe, startWith, UnaryFunction } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs/operators';
import { getPriceIncrement } from 'utils/get-price-increment';

@Directive()
export class AddForm implements AfterViewInit {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, { optional: true });
  readonly size = 's';
  readonly today = new Date(new Date().setUTCHours(12, 0, 0, 0));
  readonly maxDay = TuiDay.fromLocalNativeDate(this.today);
  minPriceIncrement = 1e-8;
  precision = this.getPrecision(this.minPriceIncrement);
  form!: FormGroup;

  get precisionAmount() {
    return this.precision === 8 ? 4 : 0;
  }

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

  updateControlDate(
    control: FormControl
  ): UnaryFunction<Observable<[TuiDay | null, TuiTime | null]>, Observable<[TuiDay | null, TuiTime | null]>> {
    return pipe(
      takeUntilDestroyed(this.#destroyRef),
      startWith(control.value),
      pairwise(),
      filter(
        ([first, last]: [[TuiDay | null, TuiTime | null], [TuiDay | null, TuiTime | null]]) =>
          first[0] === null && last[0] !== null
      ),
      map((result: [[TuiDay | null, TuiTime | null], [TuiDay | null, TuiTime | null]]) => result[1]),
      tap((result: [TuiDay | null, time: TuiTime | null]) =>
        control.patchValue([result[0], TuiTime.fromLocalNativeDate(new Date())])
      )
    );
  }

  getPrecision(minPriceIncrement: number): number {
    return minPriceIncrement === Number(minPriceIncrement) ? getPriceIncrement(minPriceIncrement) : this.precision;
  }
}
