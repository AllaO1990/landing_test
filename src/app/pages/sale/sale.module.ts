import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SaleComponent} from './sale.component';
import {SaleRoutingModule} from "./sale-routing.module";
import {ToolbarComponent} from './shared/components/toolbar/toolbar.component';
import {MatToolbarModule} from "@angular/material/toolbar";


@NgModule({
  declarations: [
    SaleComponent,
    ToolbarComponent
  ],
  imports: [
    CommonModule,
    SaleRoutingModule,
    MatToolbarModule,
  ],
})
export class SaleModule {
}
