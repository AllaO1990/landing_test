import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, Observable, of, tap } from 'rxjs';
import { DESKTOP_ENVIRONMENT } from './environment';
import { tuiPure } from '@taiga-ui/cdk';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';

export const APP_CONFIG = new InjectionToken<any>('App config');

@Injectable()
export class AppConfig {
	readonly #httpClient: HttpClient = inject(HttpClient);
	readonly #localStorage = inject(LOCAL_STORAGE);
	readonly #environment = inject(DESKTOP_ENVIRONMENT);

	#settings: any | null = null;

	@tuiPure
	get host(): string {
		if (this.#environment.production) {
			return this.#settings ? this.#settings.host : this.#environment.host;
		}

		return this.#environment.host;
	}

	loadSettings(): Observable<void> {
		return this.#httpClient.get('/assets/settings.json').pipe(
			catchError((err: Error) => of(EMPTY)),
			tap((settings: any) => (this.#settings = settings)),
			tap((settings: any) => settings && this._clearLocalStorage(settings['version']))
		);
	}

	load(): () => Observable<void> {
		return () => this.loadSettings();
	}

	_clearLocalStorage(version: number | undefined): void {
		if (!version) {
			return;
		}

		const versinLocalStorage: string | undefined = this.#localStorage.getItem('version');

		if (versinLocalStorage && +versinLocalStorage === +version) {
			return;
		}

		const mode = this.#localStorage.getItem('mode');
		this.#localStorage.clear();
		this.#localStorage.setItem('version', version.toString());
		this.#localStorage.setItem('mode', mode);
	}
}
