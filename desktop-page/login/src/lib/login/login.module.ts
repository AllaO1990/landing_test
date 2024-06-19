import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Route, RouterModule } from '@angular/router';
import { ToolbarStartModule } from '@ui/toolbar-start';
import { LoginComponent } from './login.component';

const route: Route[] = [
  {
    path: '',
    component: LoginComponent,
    // outlet: 'app-login',
    children: [
      {
        path: 'sign-in',
        loadChildren: () =>
          import('./sign-in/sign-in.module').then((m) => m.SignInModule),
        // outlet: 'sign-in',
      },
      {
        path: 'sign-up',
        loadChildren: () =>
          import('./sign-up/sign-up.module').then((m) => m.SignUpModule),
        // outlet: 'sign-up',
      },
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
