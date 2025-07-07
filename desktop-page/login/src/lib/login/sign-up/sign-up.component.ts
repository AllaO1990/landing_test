import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderComponent } from '@ui/components/loader';
import {
  TuiAlertService,
  TuiButton,
  TuiLink,
  TuiTextfield,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
} from '@taiga-ui/core';
import { Router, RouterLink } from '@angular/router';
import { triggerOpacityAnimations } from '@ui/animations/opacity.animations';
import { AuthService } from '@core/auth';
import { forkJoin, map, timer } from 'rxjs';
import { Response } from 'types/response';

@Component({
  selector: 'login-sign-up',
  standalone: true,
  imports: [
    FormsModule,
    LoaderComponent,
    ReactiveFormsModule,
    TuiButton,
    TuiTextfieldComponent,
    TuiTextfieldDirective,
    TuiTextfield,
    RouterLink,
    TuiLink,
  ],
  templateUrl: './sign-up.component.html',
  styleUrls: ['../form.scss', './sign-up.component.scss'],
  animations: [triggerOpacityAnimations('1s cubic-bezier(0.4,0.0,0.2,1)')],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
  readonly #auth: AuthService = inject(AuthService);
  readonly #router: Router = inject(Router);
  readonly #alerts: TuiAlertService = inject(TuiAlertService);

  readonly size = 'm';

  readonly formGroup: FormGroup = new FormGroup({
    email: new FormControl('yazvyazda@mail1.ru', [Validators.required, Validators.email]),
  });

  get controlEmail(): FormControl {
    return this.formGroup.get('email') as FormControl;
  }

  readonly isLoad: WritableSignal<boolean> = signal(false);

  onSubmit(event: Event): void {
    event.preventDefault();

    this.isLoad.set(true);

    forkJoin([this.#auth.onSignUp(this.controlEmail.value), timer(500)])
      .pipe(map((response: [Response<string>, number]) => response[0]))
      .subscribe((result: Response<string>) => {
        this.isLoad.set(false);

        if (result.success) {
          this.#router.navigate(['..'], { queryParams: { email: this.controlEmail.value } });
          return;
        }

        if (!result.success) {
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
