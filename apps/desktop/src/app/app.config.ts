import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { DesktopApiService } from '@desktop-data/desktop-data';
import { TUI_DIALOGS } from '@taiga-ui/cdk';
import { TUI_BUTTON_OPTIONS, TuiRootModule } from '@taiga-ui/core';
import { EnterDialogService } from 'desktop-page/enter';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { DESKTOP_API, DESKTOP_ENVIRONMENT, QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { environment } from '../environments/environment';
import { routes } from './app-routing.module';
import { httpInterceptors } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideEnvironmentNgxMask(),
    provideHttpClient(withInterceptors(httpInterceptors)),
    provideAnimations(),
    importProvidersFrom(TuiRootModule),
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
      useFactory: (router: Router, activatedRoute: ActivatedRoute) =>
        new QueryParams(router, activatedRoute),
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
    {
      provide: TUI_DIALOGS,
      useExisting: EnterDialogService,
      multi: true,
    },
  ],
};
