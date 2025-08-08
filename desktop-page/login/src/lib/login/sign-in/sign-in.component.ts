import { AfterViewInit, ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAlertService, TuiButton, TuiLink, TuiTextfield } from '@taiga-ui/core';
import { AuthService } from '@core/auth';
import { NgTemplateOutlet } from '@angular/common';
import { triggerOpacityAnimations } from '@ui/animations/opacity.animations';
import { LoaderComponent } from '@ui/components/loader';
import { forkJoin, map, timer } from 'rxjs';
import { Response } from 'types/response';
import { Router, RouterLink } from '@angular/router';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';

@Component({
  selector: 'login-sign-in',
  standalone: true,
  imports: [ReactiveFormsModule, TuiTextfield, TuiButton, NgTemplateOutlet, LoaderComponent, TuiLink, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrls: ['../form.scss', './sign-in.component.scss'],
  animations: [triggerOpacityAnimations('1s cubic-bezier(0.4,0.0,0.2,1)')],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent implements AfterViewInit {
  readonly #auth: AuthService = inject(AuthService);
  readonly #router: Router = inject(Router);
  readonly #alerts: TuiAlertService = inject(TuiAlertService);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly size = 'm';

  readonly formGroup: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    code: new FormControl(null, [Validators.required]),
  });

  get controlEmail(): FormControl {
    return this.formGroup.get('email') as FormControl;
  }

  get controlCode(): FormControl {
    return this.formGroup.get('code') as FormControl;
  }

  readonly isLoad: WritableSignal<boolean> = signal(false);
  readonly formType: WritableSignal<'email' | 'code'> = signal('email');

  ngAfterViewInit(): void {
    const { email } = this.#queryParams.value();

    if (email) {
      this.controlEmail.setValue(email);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.controlCode.value) {
      this._getToken(this.controlEmail.value, this.controlCode.value);
      return;
    }

    if (this.controlEmail.value) {
      this._getCode(this.controlEmail.value);
    }
  }

  private _getCode(email: string): void {
    this.isLoad.set(false);
    forkJoin([this.#auth.onSignIn(email), timer(500)])
      .pipe(map((response: [Response<any>, number]) => response[0]))
      .subscribe((result) => {
        this.isLoad.set(false);

        if (result.success) {
          this.formType.set('code');
          return;
        }

        if (!result.success) {
          this._showAlert('Email не найден, проверьте корректность', 'Неверный Email');
        }
      });
  }

  private _getToken(email: string, code: string): void {
    this.isLoad.set(true);
    forkJoin([this.#auth.onLogin(email, code), timer(500)])
      .pipe(map((response: [Response<any>, number]) => response[0]))
      .subscribe((result) => {
        this.isLoad.set(false);

        if (result.success) {
          this.#router.navigate(['lk']);
        }

        if (!result.success) {
          this.controlCode.reset(null);
          this._showAlert('Проверка кода из Telegram', 'Неверный код');
        }
      });
  }

  private _showAlert(content: string, label: string | undefined = undefined): void {
    this.#alerts
      .open(content, {
        label,
        appearance: 'negative',
      })
      .subscribe();
  }
}
