import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TuiAlertService, TuiLink } from '@taiga-ui/core';
import { Params, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth';
import { FormEmailComponent } from '../form-email/form-email.component';
import { forkJoin, map, Observable, timer } from 'rxjs';
import { Response } from 'types/response';
import { LoaderComponent } from '@ui/components/loader';
import { FormTelegramCodeComponent } from '../form-tg-code/form-tg-code.component';
import { AsyncPipe } from '@angular/common';
import { QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';

interface FormValue {
	email: string | null;
	code: string | null;
	agree: boolean;
}

@Component({
	selector: 'login-sign-up',
	standalone: true,
	imports: [
		FormsModule,
		ReactiveFormsModule,
		RouterLink,
		TuiLink,
		FormEmailComponent,
		LoaderComponent,
		FormTelegramCodeComponent,
		AsyncPipe,
	],
	templateUrl: './sign-up.component.html',
	styleUrls: ['../form.scss', './sign-up.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
	readonly #auth: AuthService = inject(AuthService);
	readonly #router: Router = inject(Router);
	readonly #alerts: TuiAlertService = inject(TuiAlertService);

	readonly size = 'm';
	readonly params$: Observable<Params> = this.#queryParams;
	readonly data: WritableSignal<FormValue> = signal({ email: null, agree: true, code: null });
	readonly email: Signal<string | null> = computed(() => this.data().email);
	readonly isLoad: WritableSignal<boolean> = signal(false);

	onChangeEmail(event: { agree: boolean; email: string }): void {
		this.data.update((value: FormValue) => ({ ...value, ...event }));
		this.isLoad.set(true);

		const email = this.email();

		if (email !== null) {
			forkJoin([this.#auth.onSignUp(email), timer(500)])
				.pipe(map((response: [Response<string>, number]) => response[0]))
				.subscribe((result: Response<string>) => {
					this.isLoad.set(false);

					if (!result.success) {
						this.data.update((value: FormValue) => ({ ...value, email: null }));

						this.#alerts
							.open('Такой Email уже существует, проверьте корректность', {
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
			.pipe(map((response: [Response<any>, number]) => response[0]))
			.subscribe((result) => {
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
