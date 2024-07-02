import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  AuthGuard,
  ForbiddenGuard,
  LkGuard,
  PermissionGuard,
} from './core/routing/guards';
import { ToolbarComponent } from './pages/main/shared/toolbar/toolbar.component';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('login').then((m) => m.LoginModule),
    canLoad: [AuthGuard],
    // canActivate: [AuthGuard],
    // outlet: 'login',
  },
  {
    path: 'lk',
    loadComponent: () => import('lk').then((m) => m.LkComponent),
    // component: LkComponent,
    canActivate: [LkGuard],
    canActivateChild: [LkGuard],
    // outlet: 'lk',
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
        // canActivate: [PermissionGuard],
      },
      // {
      //   path: 'main-v2',
      //   loadComponent: () =>
      //     import('./pages/main-v2').then((m) => m.MainV2Component),
      //   canActivate: [PermissionGuard],
      // },
      {
        path: 'main-v2',
        loadComponent: () => import('main').then((m) => m.MainComponent),
        // canActivate: [PermissionGuard],
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('dashboard').then((m) => m.ChartsDashboardModule),
        canActivate: [PermissionGuard],
      },
      {
        path: '403',
        loadChildren: () => import('page-403').then((m) => m.Page403Module),
        canActivate: [ForbiddenGuard],
      },
      {
        path: '**',
        loadChildren: () => import('page-404').then((m) => m.Page404Module),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  // {
  //   path: '401',
  //   loadChildren: () => import('page-401').then((m) => m.Page401Module),
  // },
  // {
  //   path: '**',
  //   loadChildren: () => import('page-401').then((m) => m.Page401Module),
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
