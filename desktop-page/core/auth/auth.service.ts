import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
	BehaviorSubject,
	catchError,
	debounceTime,
	EMPTY,
	Observable,
	of,
	shareReplay,
	Subject,
	switchMap,
	tap,
} from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { APP_CONFIG } from '../../../tokens/desktop/config';
import { Response } from '../../../types/response';
import { LOCAL_STORAGE } from '../../../tokens/desktop/local-storage';
import { LocalStorage } from '../../../stores/local/local.storage';

interface UserData {
	data: { access_token: string; token_type: string };
	ok: boolean;
	message: string;
	success: boolean;
}

export interface UserLogin {
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
	#url = '';
	readonly #document: Document = inject(DOCUMENT);
	readonly #http: HttpClient = inject(HttpClient);
	readonly #config = inject(APP_CONFIG);
	readonly #router: Router = inject(Router);
	readonly #storage: LocalStorage = inject(LOCAL_STORAGE);
	readonly #updatePermission$: Subject<void> = new BehaviorSubject<void>(undefined);

	#permission$: Observable<Response<string[]>> = this.#updatePermission$.asObservable().pipe(
		debounceTime(1000),
		switchMap(() => this.#http.get<Response<string[]>>(`${this.host}/v1/auth/permissions`)),
		shareReplay(1)
	);

	get host() {
		return this.#config.host;
	}

	setUrl(url: string) {
		this.#url = url;
	}

	getUrl(): string {
		const url = this._getFromFragment();

		if (url) {
			return url;
		}

		return this.#url;
	}

	resetUrl(): void {
		this.#url = '';
	}

	getPermission(): Observable<Response<string[]>> {
		return this.#permission$;
	}

	updatePermission(): void {
		this.#updatePermission$.next();
	}

	onSignIn(email: string): Observable<Response<any>> {
		return this.#http.post<Response<any>>(`${this.host}/v1/auth/sign-in`, { email }).pipe(
			catchError((errorResponse: HttpErrorResponse, abc) => {
				return of(errorResponse.error);
			})
		);
	}

	onSignUp(email: string): Observable<Response<string>> {
		return this.#http.post<Response<string>>(`${this.host}/v1/auth/sign-up`, { email }).pipe(
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
		return this.#http
			.post<Response<UserLogin>>(`${this.host}/v1/auth/token`, {
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
		this.#http
			.post<UserSignUpData>(`${this.host}/v1/auth/sign-up`, { email })
			.pipe(
				catchError((error, abc) => {
					this.#router.navigate(['login']);
					return this.#http.post<UserData>(`${this.host}/v1/auth/sign-in`, { email });
				})
			)
			.subscribe((data) => {
				// this.saveToken(data.token);
				if (typeof data.data === 'string') {
					window.open(data.data, '_blank');
				}

				this.#router.navigate(['login/tg-key'], { queryParams: { email } });
			});
	}

	login(email: string, password: string): Observable<UserData> {
		return this.#http.post<UserData>(`${this.host}/v1/auth/token`, { username: email, password: +password }).pipe(
			tap((data: UserData) => this._saveToken(data['data']['access_token'])),
			catchError((error, abc) => {
				this.#router.navigate(['login']);
				return EMPTY;
			})
		);
	}

	logout() {
		this.#storage.removeItem('user');

		this.#router.navigate(['login']);
	}

	get isLoggedIn(): boolean {
		const user: undefined | { token?: string } = this.#storage.getItem('user');

		return !!(user && user['token']);
	}

	getToken() {
		const user: undefined | { token?: string } = this.#storage.getItem('user');

		return user ? user['token'] : null;
	}

	private _saveToken(token: string) {
		this.#storage.setItem('user', { token });
	}

	private _getFromFragment(): string | null {
		const urlTree = this.#router.parseUrl(this.#router.url);
		const reg = /path="([/?-\w+\d+=&]+)"/;

		if (urlTree.fragment) {
			const matchResult = urlTree.fragment.match(reg);

			if (matchResult) {
				return matchResult[1];
			}
		}

		return null;
	}
}
