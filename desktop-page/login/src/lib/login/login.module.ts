import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Route, RouterModule } from '@angular/router';
import { LoginComponent } from './login.component';
import { ToolbarStartModule } from '@ui/components/toolbar-start';

const route: Route[] = [
  {
    path: '',
    component: LoginComponent,
    // outlet: 'app-login',
    children: [
      {
        path: 'sign-in-old',
        loadComponent: () => import('./sign-in-old/sign-in.component').then((c) => c.SignInComponent),
        // outlet: 'sign-in-old',
      },
      {
        path: 'tg-key',
        loadComponent: () => import('./tg-key/tg-key.component').then((c) => c.TgKeyComponent),
        // outlet: 'sign-up',
      },
      { path: '', redirectTo: 'sign-in-old', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  declarations: [LoginComponent],
  imports: [
    MatCardModule,
    MatFormField,
    MatInputModule,
    MatButtonModule,
    ToolbarStartModule,
    RouterModule.forChild(route),
  ],
  exports: [RouterModule, LoginComponent],
  providers: [],
})
export class LoginModule {}
