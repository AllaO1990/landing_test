import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MainV2Component} from "./main-v2.component";

const routes: Routes = [
  {
    path: '',
    component: MainV2Component
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {
}
