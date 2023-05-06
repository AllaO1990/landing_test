import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MainV2Component} from './main-v2.component';
import {MainRoutingModule} from "./main-v2-routing.module";
import {ListModule} from "./common/list/list.module";
import {ChartModule} from "./common/chart/chart.module";
import {EntryModule} from "./common/entry/entry.module";
import {OutModule} from "./common/out/out.module";


@NgModule({
  declarations: [
    MainV2Component
  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    ListModule,
    ChartModule,
    EntryModule,
    OutModule
  ]
})
export class MainV2Module {
}
