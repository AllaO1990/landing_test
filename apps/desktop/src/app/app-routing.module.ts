import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  AuthGuard,
  ForbiddenGuard,
  LkGuard,
  PermissionGuard,
  RegistrationGuard,
  SaleGuard,
} from './core/routing/guards';
import { LayoutStartComponent } from './shared/components/layout-start/layout-start.component';
import { LayoutLkComponent } from './shared/components/layout-lk/layout-lk.component';
import { ToolbarComponent } from './pages/main/shared/toolbar/toolbar.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutStartComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('sale').then((m) => m.SaleModule),
        canLoad: [SaleGuard],
        canActivate: [SaleGuard],
      },
      {
        path: 'login',
        loadChildren: () =>
          import('login').then((m) => m.LoginModule),
        canLoad: [AuthGuard],
        canActivate: [AuthGuard],
      },
      {
        path: 'registration',
        loadChildren: () =>
          import('registration').then((m) => m.RegistrationModule),
        canLoad: [RegistrationGuard],
        canActivate: [RegistrationGuard],
      },
    ],
  },
  {
    path: 'lk',
    component: LayoutLkComponent,
    canActivate: [LkGuard],
    canActivateChild: [LkGuard],
    children: [
      {
        path: '',
        outlet: 'toolbar-main',
        component: ToolbarComponent,
      },
      {
        path: '',
        redirectTo: 'main-v2',
        pathMatch: 'full',
      },
      {
        path: 'main',
        loadChildren: () =>
          import('./pages/main/main.module').then((m) => m.MainModule),
        canActivate: [PermissionGuard],
      },
      {
        path: 'main-v2',
        loadChildren: () =>
          import('./pages/main-v2/main-v2.module').then((m) => m.MainV2Module),
        canActivate: [PermissionGuard],
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('dashboard').then(
            (m) => m.ChartsDashboardModule
          ),
        canActivate: [PermissionGuard],
      },
      {
        path: '403',
        loadChildren: () =>
          import('page-403').then((m) => m.Page403Module),
        canActivate: [ForbiddenGuard],
      },
      {
        path: '**',
        loadChildren: () =>
          import('page-404').then((m) => m.Page404Module),
      },
    ],
  },
  {
    path: '401',
    loadChildren: () => import('page-401').then((m) => m.Page401Module),
  },
  {
    path: '**',
    loadChildren: () => import('page-401').then((m) => m.Page401Module),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
