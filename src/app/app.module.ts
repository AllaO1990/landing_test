import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {MAT_DATE_LOCALE, MatNativeDateModule} from '@angular/material/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LayoutStartModule} from "./shared/components/layout-start";
import {LayoutLkModule} from "./shared/components/layout-lk";


@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatNativeDateModule,
    LayoutStartModule,
    LayoutLkModule
  ],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'ru-RU'},
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
