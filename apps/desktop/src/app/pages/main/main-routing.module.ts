import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { ToolbarComponent } from './shared/toolbar/toolbar.component';

const routes: Routes = [
  // {
  //   path: '',
  //   outlet: 'toolbar-main',
  //   component: ToolbarComponent
  // },
  {
    path: '',
    component: MainComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
