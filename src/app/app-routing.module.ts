import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from './core/routing/guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginModule),
    canLoad: [AuthGuard],
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./pages/charts-dashboard/charts-dashboard.module').then(
        (m) => m.ChartsDashboardModule
      ),
    canLoad: [AuthGuard],
    canActivate: [AuthGuard],
  },
  {
    path: '',
    loadChildren: () =>
      import('./app-router/app-router.module').then((m) => m.AppRouterModule),
    canLoad: [AuthGuard],
    canActivate: [AuthGuard],
  },
  {
    path: '401',
    loadChildren: () => import('./pages/page-401').then((m) => m.Page401Module)
  },
  {
    path: '403',
    loadChildren: () => import('./pages/page-403').then((m) => m.Page403Module)
  },
  {
    path: '**',
    loadChildren: () => import('./pages/page-404').then((m) => m.Page404Module)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
