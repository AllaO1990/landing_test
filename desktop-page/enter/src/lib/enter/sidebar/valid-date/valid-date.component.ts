import { TuiCheckbox } from '@taiga-ui/kit';
import { TuiLabel } from '@taiga-ui/core';
import { TuiInputDateModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { ChangeDetectionStrategy, Component, DestroyRef, forwardRef, inject, OnInit } from '@angular/core';
import { VALID_DATE_CONSTANTS } from './valid-date.constants';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TuiDay } from '@taiga-ui/cdk';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, startWith } from 'rxjs';

@Component({
  selector: 'lib-enter-sidebar-valid-date',
  standalone: true,
  imports: [ReactiveFormsModule, TuiLabel, TuiInputDateModule, TuiTextfieldControllerModule, TuiCheckbox],
  templateUrl: './valid-date.component.html',
  styleUrl: './valid-date.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ValidDateComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidDateComponent implements ControlValueAccessor, OnInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);

  public readonly constants = VALID_DATE_CONSTANTS;

  value: string | null = null;

  readonly form: FormGroup = new FormGroup({
    calendar: new FormControl({ value: this._getTuiDay(this.value), disabled: true }),
    checkbox: new FormControl({ value: true, disabled: true }),
  });

  get controlCalendar(): FormControl {
    return this.form.get('calendar') as FormControl;
  }

  get controlCheckbox(): FormControl {
    return this.form.get('checkbox') as FormControl;
  }

  onChange = (_: string | null): void => {};
  onTouched = (): void => {};

  writeValue(value: string | null): void {
    this.value = value;
    this.onChange(value);
  }

  registerOnChange(fn: (_: string | null) => {}): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => {}): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.form[isDisabled ? 'disable' : 'enable']();
  }

  ngOnInit(): void {
    this.controlCheckbox.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.controlCheckbox.value), distinctUntilChanged())
      .subscribe((result: boolean) => this.controlCalendar[result ? 'disable' : 'enable']());

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.form.value))
      .subscribe((result: { checkbox: boolean; calendar: TuiDay }) => {
        if (result.checkbox) {
          this.onChange(null);
          return;
        }

        this.onChange(result.calendar.toString());
      });
  }

  private _getTuiDay(value: string | null): TuiDay {
    let date: Date = new Date();

    if (value !== null) {
      date = new Date(value);
    }

    return new TuiDay(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
