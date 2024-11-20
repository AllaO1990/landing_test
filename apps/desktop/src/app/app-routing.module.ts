import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, ForbiddenGuard, LkGuard, PermissionGuard } from './core/routing/guards';

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
    canActivate: [LkGuard],
    canActivateChild: [LkGuard],
    children: [
      {
        path: '',
        redirectTo: 'main-v2',
        pathMatch: 'full',
      },
      {
        path: 'main-v2',
        canActivate: [PermissionGuard],
        children: [
          {
            path: '',
            outlet: 'toolbar-main',
            loadComponent: () => import('ui-common').then((m) => m.ToolbarSearchComponent),
          },
          {
            path: '',
            loadComponent: () => import('main').then((m) => m.MainComponent),
          },
          {
            path: ':type/:id',
            loadComponent: () => import('main').then((m) => m.MainComponent),
          },
        ],
      },
      //   {
      //     path: 'main',
      //     loadChildren: () => import('./pages/main/main.module').then((m) => m.MainModule),
      //   },
      //   // {
      //   //   path: 'dashboard',
      //   //   loadChildren: () => import('dashboard').then((m) => m.ChartsDashboardModule),
      //   //   canActivate: [PermissionGuard],
      //   // },
      {
        path: 'portfolio',
        children: [
          {
            path: '',
            outlet: 'toolbar-main',
            loadComponent: () => import('portfolio').then((m) => m.FilterComponent),
          },
          {
            path: '',
            loadComponent: () => import('portfolio').then((m) => m.LayoutComponent),
          },
        ],
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
  {
    path: '**',
    loadChildren: () => import('page-404').then((m) => m.Page404Module),
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
