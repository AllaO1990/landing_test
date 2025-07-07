import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, EMPTY, Observable, of, tap } from 'rxjs';
import { VtLocalStorageService } from '../storage';
import { DESKTOP_ENVIRONMENT } from '../../../tokens/desktop';
import { Response } from '../../../types/response';
import { DOCUMENT } from '@angular/common';

interface UserData {
  data: { access_token: string; token_type: string };
  ok: boolean;
  message: string;
  success: boolean;
}

interface UserLogin {
  access_token: string;
  token_type: string;
}

interface UserSignUpData {
  data: string;
  ok: boolean;
  message: string;
  success: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  #document: Document = inject(DOCUMENT);
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _environment = inject(DESKTOP_ENVIRONMENT);

  get host() {
    return this._environment.host;
  }

  constructor(private _router: Router, private _storage: VtLocalStorageService) {}

  onSignIn(email: string): Observable<Response<any>> {
    return this._http.post<Response<any>>(`${this.host}/api/v1/auth/sign-in`, { email }).pipe(
      catchError((errorResponse: HttpErrorResponse, abc) => {
        return of(errorResponse.error);
      })
    );

    // return of({
    //   success: true,
    //   message: 'ok',
    //   data: '',
    // });
  }

  onSignUp(email: string): Observable<Response<string>> {
    return this._http.post<Response<string>>(`${this.host}/api/v1/auth/sign-up`, { email }).pipe(
      tap(
        (response: Response<string>) =>
          response.success && this.#document.defaultView && this.#document.defaultView.open(response.data)
      ),
      catchError((errorResponse: HttpErrorResponse, abc) => {
        return of(errorResponse.error);
      })
    );
  }

  onLogin(email: string, code: string): Observable<Response<UserLogin>> {
    return this._http
      .post<Response<UserLogin>>(`${this.host}/api/v1/auth/token`, {
        username: email,
        password: +code,
      })
      .pipe(
        catchError((errorResponse: HttpErrorResponse, abc) => {
          return of(errorResponse.error);
        }),
        tap((response: Response<UserLogin>) => response.success && this._saveToken(response['data']['access_token']))
      );
    // .subscribe((data) => {
    //   this._saveToken(data['data']['access_token']);
    //
    //   this._router.navigate(['lk']);
    // });
  }

  getKey(email: string) {
    this._http
      .post<UserSignUpData>(`${this.host}/api/v1/auth/sign-up`, { email })
      .pipe(
        catchError((error, abc) => {
          this._router.navigate(['login']);
          return this._http.post<UserData>(`${this.host}/api/v1/auth/sign-in`, { email });
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
      .post<UserData>(`${this.host}/api/v1/auth/token`, { username: email, password: +password })
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
