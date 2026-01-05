import { ChangeDetectionStrategy, Component, inject, Input, output, OutputEmitterRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiTextfield, TuiTextfieldComponent, TuiTextfieldDirective } from '@taiga-ui/core';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';

interface FormValue {
	email: string;
	agree: boolean;
}

@Component({
	selector: 'login-form-email',
	templateUrl: './form-email.component.html',
	styleUrls: ['../form.scss', './form-email.component.scss'],
	standalone: true,
	imports: [ReactiveFormsModule, TuiButton, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfield],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEmailComponent {
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

	@Input() set agree(value: string) {
		this.controlAgree.setValue(value);
	}

	get email(): string {
		const value = this.#queryParams.value();

		return value['email'] ? value['email'] : '';
	}

	readonly changed: OutputEmitterRef<FormValue> = output();
	readonly size = 'm';
	readonly formGroup: FormGroup = new FormGroup({
		email: new FormControl(this.email, [Validators.required, Validators.email]),
		agree: new FormControl(null, Validators.required),
	});

	get controlAgree(): FormControl {
		return this.formGroup.get('agree') as FormControl;
	}

	get controlEmail(): FormControl {
		return this.formGroup.get('email') as FormControl;
	}

	onSubmit(event: Event) {
		event.preventDefault();

		this.#queryParams.update({ email: this.controlEmail.value });
		this.changed.emit(this.formGroup.value);
	}
}
