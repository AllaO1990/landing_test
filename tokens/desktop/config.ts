import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, Observable, of, tap } from 'rxjs';
import { DESKTOP_ENVIRONMENT } from './environment';
import { tuiPure } from '@taiga-ui/cdk';

export const APP_CONFIG = new InjectionToken<any>('App config');

@Injectable()
export class AppConfig {
  readonly #httpClient: HttpClient = inject(HttpClient);
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
      tap((settings: any) => (this.#settings = settings))
    );
  }

  load(): () => Observable<void> {
    return () => this.loadSettings();
  }
}
