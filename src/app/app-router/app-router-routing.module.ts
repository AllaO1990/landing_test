import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppRouterComponent } from './app-router.component';

const routes: Routes = [
  {
    path: '',
    component: AppRouterComponent,
    children: [
      {
        path: 'main',
        loadChildren: () =>
          import('../pages/main/main.module').then(m => m.MainModule)
      },
      {
        path: 'second',
        loadChildren: () =>
          import('../pages/second/second.module').then(m => m.SecondModule)
      },
      {
        path: '',
        redirectTo: 'main',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppRouterRoutingModule {}
