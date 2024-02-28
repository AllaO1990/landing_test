import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChartsDashboardComponent } from './charts-dashboard.component';
import { ToolbarComponent } from '../main/shared/toolbar/toolbar.component';

const routes: Routes = [
  // {
  //   path: '',
  //   outlet: 'toolbar-main',
  //   component: ToolbarComponent
  // },
  {
    path: '',
    component: ChartsDashboardComponent,
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SecondRoutingModule {}
