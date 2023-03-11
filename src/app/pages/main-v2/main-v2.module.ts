import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainV2Component } from './main-v2.component';
import {MainRoutingModule} from "./main-v2-routing.module";


@NgModule({
  declarations: [
    MainV2Component
  ],
  imports: [
    CommonModule,
    MainRoutingModule
  ]
})
export class MainV2Module { }
