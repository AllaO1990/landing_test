import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PageComponent} from './page/page.component';
import {Page401RoutingModule} from "./page-401-routing.module";
import {PageClientErrorModule} from "../../shared/components/page-client-error";

@NgModule({
  declarations: [
    PageComponent
  ],
  imports: [
    CommonModule,
    Page401RoutingModule,
    PageClientErrorModule
  ]
})
export class Page401Module {
}
