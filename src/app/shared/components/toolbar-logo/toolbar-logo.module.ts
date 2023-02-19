import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ToolbarLogoComponent} from './toolbar-logo.component';
import {RouterModule} from "@angular/router";


@NgModule({
  declarations: [
    ToolbarLogoComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    ToolbarLogoComponent
  ]
})
export class ToolbarLogoModule {
}
