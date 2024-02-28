import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutStartModule } from './shared/components/layout-start';
import { LayoutLkModule } from './shared/components/layout-lk';
import { TUI_BUTTON_OPTIONS, TuiRootModule } from '@taiga-ui/core';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    TuiRootModule,
    MatNativeDateModule,
    LayoutStartModule,
    LayoutLkModule,
  ],
  providers: [
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
