import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiAlertService, TuiLink } from '@taiga-ui/core';
import { AuthService, UserLogin } from '@core/auth';
import { LoaderComponent } from '@ui/components/loader';
import { forkJoin, map, Observable, timer } from 'rxjs';
import { Response } from 'types/response';
import { Params, Router, RouterLink } from '@angular/router';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { TuiBlock, TuiCheckbox } from '@taiga-ui/kit';
import { FormEmailComponent } from '../form-email/form-email.component';
import { FormTelegramCodeComponent } from '../form-tg-code/form-tg-code.component';
import { AsyncPipe } from '@angular/common';

interface FormValue {
	email: string | null;
	code: string | null;
	agree: boolean;
}

@Component({
	selector: 'login-sign-in',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		LoaderComponent,
		TuiLink,
		RouterLink,
		TuiBlock,
		TuiCheckbox,
		FormEmailComponent,
		FormTelegramCodeComponent,
		AsyncPipe,
	],
	templateUrl: './sign-in.component.html',
	styleUrls: ['../form.scss', './sign-in.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {
	readonly #auth: AuthService = inject(AuthService);
	readonly #router: Router = inject(Router);
	readonly #alerts: TuiAlertService = inject(TuiAlertService);
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

	readonly size = 'm';

	readonly formGroup: FormGroup = new FormGroup({
		agree: new FormControl(false),
	});

	get controlAgree(): FormControl {
		return this.formGroup.get('agree') as FormControl;
	}

	readonly params$: Observable<Params> = this.#queryParams;
	readonly data: WritableSignal<FormValue> = signal({ email: null, code: null, agree: false });
	readonly email: Signal<string | null> = computed(() => this.data().email);
	readonly isLoad: WritableSignal<boolean> = signal(false);

	onChangeEmail(event: { agree: boolean; email: string }): void {
		this.data.update((value: FormValue) => ({ ...value, ...event }));
		this.isLoad.set(true);

		const email = this.email();

		if (email) {
			forkJoin([this.#auth.onSignIn(email), timer(500)])
				.pipe(map((response: [Response<any>, number]) => response[0]))
				.subscribe((result) => {
					this.isLoad.set(false);

					if (!result.success) {
						this.data.update((value: FormValue) => ({ ...value, email: null }));

						this.#alerts
							.open('Email не найден, проверьте корректность', {
								label: 'Неверный Email',
								appearance: 'negative',
							})
							.subscribe();
					}
				});
		}
	}

	onChangeCode(event: { code: string; email: string }): void {
		this.data.update((value: FormValue) => ({ ...value, ...event }));
		this.isLoad.set(true);

		forkJoin([this.#auth.onLogin(event.email, event.code), timer(500)])
			.pipe(map((response: [Response<UserLogin>, number]) => response[0]))
			.subscribe((result: Response<UserLogin>) => {
				this.isLoad.set(false);

				if (result.success) {
					if (this.#auth.getUrl()) {
						this.#router.navigateByUrl(this.#auth.getUrl());
						this.#auth.resetUrl();
					} else {
						this.#router.navigate(['lk']);
					}
				}

				if (!result.success) {
					this.data.update((value: FormValue) => ({ ...value, code: null }));

					this.#alerts
						.open('Проверка кода из Telegram', {
							label: 'Неверный код',
							appearance: 'negative',
						})
						.subscribe();
				}
			});
	}
}
