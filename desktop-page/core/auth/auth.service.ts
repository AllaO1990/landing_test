import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { VtLocalStorageService } from '../storage';

interface UserData {
  data: { access_token: string; token_type: string };
  ok: boolean;
  message: string;
  success: boolean;
}

interface UserSignUpData {
  data: string;
  ok: boolean;
  message: string;
  success: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http: HttpClient = inject(HttpClient);

  // isLoggedIn = false;

  constructor(private _router: Router, private _storage: VtLocalStorageService) {}

  getKey(email: string) {
    // this.isLoggedIn = true;
    // this._router.navigate(['lk']);

    this._http
      .post<UserSignUpData>('https://trade.gpn.dev/api/v1/auth/sign-up', { email })
      .pipe(
        catchError((error, abc) => {
          this._router.navigate(['login']);
          return this._http.post<UserData>('https://trade.gpn.dev/api/v1/auth/sign-in', { email });
        })
      )
      .subscribe((data) => {
        // this.saveToken(data.token);
        if (typeof data.data === 'string') {
          window.open(data.data, '_blank');
        }

        this._router.navigate(['login/tg-key'], { queryParams: { email } });
      });
  }

  login(email: string, password: string) {
    this._http
      .post<UserData>('https://trade.gpn.dev/api/v1/auth/token', { username: email, password: +password })
      .pipe(
        catchError((error, abc) => {
          this._router.navigate(['login']);
          return EMPTY;
        })
      )
      .subscribe((data) => {
        this._saveToken(data['data']['access_token']);

        this._router.navigate(['lk']);
      });
  }

  logout() {
    this._storage.setObject('user', {});
    this._router.navigate(['login']);
  }

  get isLoggedIn() {
    return !!this._storage.getObject('user')['token'];
  }

  getToken() {
    return this._storage.getObject('user')['token'];
  }

  private _saveToken(token: string) {
    this._storage.setObject('user', { token });
  }
}
