import { ChangeDetectionStrategy, Component, Input, output, OutputEmitterRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiTextfield, TuiTextfieldComponent, TuiTextfieldDirective } from '@taiga-ui/core';

interface FormValue {
	email: string;
	code: string;
}

@Component({
	selector: 'login-form-tg-code',
	templateUrl: 'form-tg-code.component.html',
	styleUrls: ['../form.scss', 'form-tg-code.component.scss'],
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ReactiveFormsModule, TuiButton, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfield],
})
export class FormTelegramCodeComponent {
	@Input() set email(value: string) {
		this.controlEmail.setValue(value);
	}

	readonly changed: OutputEmitterRef<FormValue> = output();
	readonly size = 'm';
	readonly formGroup: FormGroup = new FormGroup({
		email: new FormControl(null, [Validators.required, Validators.email]),
		code: new FormControl(null, Validators.required),
	});

	get controlCode(): FormControl {
		return this.formGroup.get('code') as FormControl;
	}

	get controlEmail(): FormControl {
		return this.formGroup.get('email') as FormControl;
	}

	onSubmit(event: Event) {
		event.preventDefault();

		this.changed.emit(this.formGroup.value);
		// forkJoin([this.#auth.onLogin(this.controlEmail.value, this.controlCode.value), timer(500)])
		// 	.pipe(map((response: [Response<UserLogin>, number]) => response[0]))
		// 	.subscribe((result: Response<UserLogin>) => {
		// if (result.success) {
		// 	if (this.#auth.getUrl()) {
		// 		this.#router.navigateByUrl(this.#auth.getUrl());
		// 		this.#auth.resetUrl();
		// 	} else {
		// 		this.#router.navigate(['lk']);
		// 	}
		// }
		//
		// if (!result.success) {
		// 	this.controlCode.reset(null);
		// 	this._showAlert('Проверка кода из Telegram', 'Неверный код');
		// }
		// });
	}
}
