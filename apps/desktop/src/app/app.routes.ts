import {inject, Injector} from '@angular/core';
import {RedirectFunction, Routes} from '@angular/router';
import {authGuardCanActivate, lkGuardCanActivate} from './core/routing/guards';
import {LOCAL_STORAGE} from 'tokens/desktop/local-storage';
import {paymentGuardCanActivate} from './core/routing/guards/payment.guard';

const redirectFn: RedirectFunction = () => inject(Injector).get(LOCAL_STORAGE).getItem('mode') || 'light';

export const routes: Routes = [
	{
		path: 'login',
		loadChildren: () => import('login').then((m) => m.ROUTES),
		canActivate: [authGuardCanActivate],
	},
	{
		path: 'lk',
		loadComponent: () => import('lk').then((m) => m.LkComponent),
		canActivate: [lkGuardCanActivate],
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
			{
				path: 'payment',
				canActivate: [paymentGuardCanActivate],
				children: [
					{
						path: '',
						outlet: 'toolbar-right',
						loadComponent: () => import('payment').then((m) => m.PaymentToolbarComponent),
					},
					{
						path: '',
						loadComponent: () => import('payment').then((m) => m.PaymentComponent),
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
			// {
			// 	path: '403',
			// 	loadChildren: () => import('page-403').then((m) => m.Page403Module),
			// 	canActivate: [ForbiddenGuard],
			// },
			{
				path: '**',
				loadChildren: () => import('page-404').then((m) => m.Page404Module),
			},
		],
	},
	// {
	// 	path: '',
	// 	loadComponent: () => import('landing').then((m) => m.LayoutComponent),
	// },
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
