import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard, ForbiddenGuard, LkGuard, PermissionGuard, RegistrationGuard, SaleGuard} from "./core/routing/guards";

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/sale').then(m => m.SaleModule),
    canLoad: [SaleGuard],
    canActivate: [SaleGuard]
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./pages/login/login.module').then(m => m.LoginModule),
    canLoad: [AuthGuard],
    canActivate: [AuthGuard],
  },
  {
    path: 'registration',
    loadChildren: () => import('./pages/registration').then(m => m.RegistrationModule),
    canLoad: [RegistrationGuard],
    canActivate: [RegistrationGuard]
  },
  {
    path: 'lk',
    canActivate: [LkGuard],
    canActivateChild: [LkGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./app-router/app-router.module').then((m) => m.AppRouterModule),
        canActivate: [PermissionGuard],
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/dashboard/charts-dashboard.module').then(
            (m) => m.ChartsDashboardModule
          ),
        canActivate: [PermissionGuard],
      },
      {
        path: '403',
        loadChildren: () => import('./pages/page-403').then((m) => m.Page403Module),
        canActivate: [ForbiddenGuard],
      },
      {
        path: '**',
        loadChildren: () => import('./pages/page-404').then((m) => m.Page404Module)
      }
    ]
  },
  {
    path: '401',
    loadChildren: () => import('./pages/page-401').then((m) => m.Page401Module)
  },
  {
    path: '**',
    loadChildren: () => import('./pages/page-401').then((m) => m.Page401Module)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
