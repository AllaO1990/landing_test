import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { DesktopApiService } from '@desktop-data/desktop-data';
import { TUI_BUTTON_OPTIONS, TUI_MEDIA, tuiNumberFormatProvider } from '@taiga-ui/core';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { DESKTOP_API, DESKTOP_ENVIRONMENT, GlobalDateRangeService, QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { environment } from '../environments/environment';
import { routes } from './app-routing.module';
import { httpInterceptors } from './core/interceptors';
import { TUI_LANGUAGE, TUI_RUSSIAN_LANGUAGE } from '@taiga-ui/i18n';
import { of } from 'rxjs';
import { WINDOW } from 'tokens/desktop/window';
import { DOCUMENT } from '@angular/common';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';
import { LocalStorage } from 'storage/local.storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideEnvironmentNgxMask(),
    provideHttpClient(withInterceptors(httpInterceptors)),
    provideAnimations(),
    importProvidersFrom(),
    // NG_EVENT_PLUGINS,
    provideEventPlugins(),
    {
      provide: WINDOW,
      useFactory: (document: Document): Window => document.defaultView!,
      deps: [DOCUMENT],
    },
    {
      provide: LOCAL_STORAGE,
      useClass: LocalStorage,
    },
    {
      provide: DESKTOP_ENVIRONMENT,
      useValue: environment,
    },
    {
      provide: DESKTOP_API,
      useFactory: (env: object) => new DesktopApiService(),
      deps: [DESKTOP_ENVIRONMENT],
    },
    {
      provide: QUERY_PARAMS,
      useFactory: (router: Router, activatedRoute: ActivatedRoute) => new QueryParams(router, activatedRoute),
      deps: [Router, ActivatedRoute],
    },
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'ru-RU',
    },
    {
      provide: TUI_BUTTON_OPTIONS,
      useValue: {
        appearance: 'primary',
        size: 's',
        shape: null,
      },
    },
    tuiNumberFormatProvider({
      decimalSeparator: '.',
      precision: Infinity,
      decimalMode: 'not-zero',
    }),
    {
      provide: TUI_MEDIA,
      useValue: {
        mobile: 768,
        desktopSmall: 1024,
        desktopLarge: 1280,
        desktopLarger: 1440,
        desktopLargest: 1920,
      },
    },
    {
      provide: TUI_LANGUAGE,
      useValue: of(TUI_RUSSIAN_LANGUAGE),
    },
    GlobalDateRangeService,
  ],
};
