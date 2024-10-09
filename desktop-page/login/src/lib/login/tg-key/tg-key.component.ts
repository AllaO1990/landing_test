import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { AuthService } from '@core/auth';

@Component({
  selector: 'lib-tg-key',
  templateUrl: './tg-key.component.html',
  styleUrls: ['./tg-key.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    NgxMaskDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TgKeyComponent implements OnInit {
  email: string | null = '';

  keyFormControl = new FormControl('', [Validators.required]);

  constructor(private _authService: AuthService, private _router: ActivatedRoute) {}

  ngOnInit(): void {
    this.email = this._router.snapshot.queryParamMap.get('email');
  }

  login() {
    // this._authService.login();
    // this._router.navigate(['lk']);

    if (!this.email || !this.keyFormControl.value || this.keyFormControl.errors || !this.keyFormControl.valid) {
      return;
    }

    this._authService.login(this.email, this.keyFormControl.value);
  }
}
