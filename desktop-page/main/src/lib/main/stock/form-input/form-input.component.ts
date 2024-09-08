import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButtonModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TUI_ITEMS_HANDLERS, TuiInputModule, TuiInputPasswordModule, TuiItemsHandlers } from '@taiga-ui/kit';
import { FormInputEvent } from './form-input.types';
import { TuiAutoFocusModule, TuiStringHandler } from '@taiga-ui/cdk';

@Component({
  selector: 'lib-form-input',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiButtonModule,
    TuiInputModule,
    TuiInputPasswordModule,
    TuiTextfieldControllerModule,
    TuiAutoFocusModule,
  ],
  templateUrl: './form-input.component.html',
  styleUrl: './form-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormInputComponent<T> {
  private _itemsHandlers: TuiItemsHandlers<T> = inject(TUI_ITEMS_HANDLERS);
  private _stringify: TuiStringHandler<T> = this._itemsHandlers.stringify;
  private _value: T | null = null;

  readonly form: FormGroup = new FormGroup<{ name: FormControl<string | null> }>({
    name: new FormControl(null, Validators.required),
  });

  get controlName() {
    return this.form.get('name') as FormControl<string | null>;
  }

  @Input()
  set value(value: T) {
    this._value = value;
    this.controlName.patchValue(this._stringify(value));
  }

  @Input() set stringify(value: TuiStringHandler<T>) {
    if (value) {
      this._stringify = value;

      if (this._value) {
        this.controlName.patchValue(this._stringify(this._value));
      }
    }
  }

  @Output() formEvent: EventEmitter<FormInputEvent<T>> = new EventEmitter<FormInputEvent<T>>();

  onSubmit(event: Event): void {
    event.preventDefault();

    this.formEvent.emit({
      type: 'submit',
      value: this._value as T,
      changed: this.controlName.value,
    });
  }

  onCancel(event: Event): void {
    event.preventDefault();

    this.formEvent.emit({
      type: 'cancel',
      value: this._value as T,
      changed: null,
    });
  }
}
