import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChartsDashboardComponent } from './charts-dashboard.component';

const routes: Routes = [
  // {
  //   path: '',
  //   outlet: 'nav-search-main',
  //   component: NavComponent
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
