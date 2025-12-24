import { inject, Injector, NgModule } from '@angular/core';
import { RedirectFunction, RouterModule, Routes } from '@angular/router';
import { AuthGuard, ForbiddenGuard, LkGuard, PermissionGuard } from './core/routing/guards';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';

const redirectFn: RedirectFunction = (redirectData) => inject(Injector).get(LOCAL_STORAGE).getItem('mode') || 'light';

export const routes: Routes = [
  {
    path: 'login',
    // loadComponent: () => import('login').then((m) => m.LoginComponent),
    loadChildren: () => import('login').then((m) => m.ROUTES),
    // loadChildren: () => import('login').then((m) => m.LoginComponent),
    canMatch: [AuthGuard],
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
        redirectTo: redirectFn,
        pathMatch: 'full',
      },
      {
        path: 'main-v2',
        redirectTo: redirectFn,
        pathMatch: 'full',
      },
      {
        path: 'short-link',
        redirectTo: redirectFn,
        pathMatch: 'full',
      },
      {
        path: 'payment',
        loadComponent: () => import('payment').then((m) => m.PaymentComponent),
      },
      {
        path: 'light',
        children: [
          {
            path: '',
            outlet: 'toolbar-right',
            loadComponent: () => import('light').then((m) => m.ToolbarComponent),
          },
          {
            path: '',
            loadComponent: () => import('light').then((m) => m.LightLayoutComponent),
          },
        ],
      },
      {
        path: 'pro',
        children: [
          {
            path: '',
            outlet: 'toolbar-right',
            loadComponent: () => import('pro').then((m) => m.ToolbarProComponent),
          },
          {
            path: '',
            redirectTo: 'main',
            pathMatch: 'full',
          },
          {
            path: 'main',
            canActivate: [PermissionGuard],
            children: [
              {
                path: '',
                outlet: 'toolbar-left',
                loadComponent: () => import('main').then((m) => m.ToolbarSearchComponent),
              },
              {
                path: '',
                loadComponent: () => import('main').then((m) => m.MainComponent),
              },
            ],
          },
          {
            path: 'portfolio',
            children: [
              {
                path: '',
                outlet: 'toolbar-left',
                loadComponent: () => import('portfolio').then((m) => m.FilterComponent),
              },
              {
                path: '',
                loadComponent: () => import('portfolio').then((m) => m.LayoutComponent),
              },
            ],
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
