import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import { VtLocalStorageService } from '../storage/local-storage.service';

interface UserData {
  data: string;
  ok: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http: HttpClient = inject(HttpClient);

  // isLoggedIn = false;

  constructor(
    private _router: Router,
    private _storage: VtLocalStorageService
  ) {}

  getKey(email: string) {
    // this.isLoggedIn = true;
    // this._router.navigate(['lk']);

    this._http
      .post<UserData>('https://trade.gpn.dev/api/v1/users/sign-up', { email })
      .pipe(
        catchError((error, abc) => {
          this._router.navigate(['login']);
          return this._http.post<UserData>(
            'https://trade.gpn.dev/api/v1/users/sign-in',
            { email }
          );
        })
      )
      .subscribe((data) => {
        // this.saveToken(data.token);
        console.log(data);
        if (data.data) {
          window.open(data.data, '_blank', 'popup');
        }

        this._router.navigate(['login/tg-key'], { queryParams: { email } });
      });
  }

  login(email: string, password: string) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    this._http
      .post<UserData>('https://trade.gpn.dev/api/v1/users/token', formData)
      .pipe(
        catchError((error, abc) => {
          this._router.navigate(['login']);
          return EMPTY;
        })
      )
      .subscribe((data) => {
        // this.saveToken(data.token);
        console.log(data);
        // this.isLoggedIn = true;
        // @ts-expect-error ignore
        this._saveToken(data['access_token']);

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
