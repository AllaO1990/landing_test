import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DesktopApiService } from '@desktop-data/desktop-data';
import {
  TUI_BUTTON_OPTIONS,
  TuiDialogModule,
  TuiModeModule,
  TuiRootModule,
} from '@taiga-ui/core';
import { DESKTOP_API, DESKTOP_ENVIRONMENT } from 'tokens/desktop';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutStartModule } from './shared/components/layout-start';
import { TUI_DIALOGS } from '@taiga-ui/cdk';
import { EnterDialogService } from 'desktop-page/enter';
import { QUERY_PARAMS } from 'tokens/desktop/query-params';
import { QueryParams } from 'utils/query-params';
import { ActivatedRoute, Router } from '@angular/router';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    TuiRootModule,
    MatNativeDateModule,
    LayoutStartModule,
    TuiModeModule,
    TuiDialogModule,
  ],
  providers: [
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
  bootstrap: [AppComponent],
})
export class AppModule {}
