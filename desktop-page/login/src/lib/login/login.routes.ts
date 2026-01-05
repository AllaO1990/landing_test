import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';

export const ROUTES: Routes = [
	{
		path: '',
		component: LoginComponent,
		children: [
			{
				path: 'sign-in',
				loadComponent: () => import('./sign-in/sign-in.component').then((c) => c.SignInComponent),
			},
			{
				path: 'sign-up',
				loadComponent: () => import('./sign-up/sign-up.component').then((c) => c.SignUpComponent),
			},
			{ path: '', redirectTo: 'sign-in', pathMatch: 'full' },
		],
	},
];
