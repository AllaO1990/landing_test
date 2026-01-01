import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TUI_ITEMS_HANDLERS, TuiItemsHandlers } from '@taiga-ui/kit';
import { FormEventEnum, FormInputEvent } from './input-with-actions.types';
import { TuiAutoFocus, TuiStringHandler } from '@taiga-ui/cdk';
import type { TuiSizeL, TuiSizeS } from '@taiga-ui/core/types';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';

@Component({
	selector: 'lib-input-with-actions',
	standalone: true,
	imports: [ReactiveFormsModule, TuiButton, TuiTextfield, TuiAutoFocus],
	templateUrl: './input-with-actions.component.html',
	styleUrl: './input-with-actions.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputWithActionsComponent<T> {
	private _itemsHandlers: TuiItemsHandlers<T> = inject(TUI_ITEMS_HANDLERS);
	private _stringify: TuiStringHandler<T> = this._itemsHandlers.stringify;
	private _value: T | null = null;

	readonly form: FormGroup = new FormGroup<{ name: FormControl<string | null> }>({
		name: new FormControl(null, Validators.required),
	});

	get controlName() {
		return this.form.get('name') as FormControl<string | null>;
	}

	@Input() size: TuiSizeL | TuiSizeS = 's';

	@Input() placeholder = '';

	@Input()
	set value(value: T) {
		this._value = value;
		const controlValue = value !== null ? this._stringify(value) : null;
		this.controlName.patchValue(controlValue);
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
			type: FormEventEnum.SUBMIT,
			value: this._value as T,
			changed: this.controlName.value,
		});
	}

	onCancel(event: Event): void {
		event.preventDefault();

		this.formEvent.emit({
			type: FormEventEnum.CANCEL,
			value: this._value as T,
			changed: null,
		});
	}
}
