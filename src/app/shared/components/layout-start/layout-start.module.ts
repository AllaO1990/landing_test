import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LayoutStartComponent} from './layout-start.component';
import {RouterModule} from "@angular/router";
import {ToolbarStartModule} from "../toolbar-start";


@NgModule({
  declarations: [
    LayoutStartComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ToolbarStartModule
  ]
})
export class LayoutStartModule {
}
