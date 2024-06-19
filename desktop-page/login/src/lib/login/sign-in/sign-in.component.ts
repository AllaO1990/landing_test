import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../../apps/desktop/src/app/core/auth/auth.service';

@Component({
  selector: 'lib-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent implements OnInit {
  constructor(private _authService: AuthService, private _router: Router) {}

  ngOnInit(): void {}

  login() {
    this._authService.login();
    this._router.navigate(['lk']);
  }
}
