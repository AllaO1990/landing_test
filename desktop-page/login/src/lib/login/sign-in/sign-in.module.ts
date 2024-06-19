import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Route, RouterModule } from '@angular/router';
import { SignInComponent } from './sign-in.component';

const route: Route[] = [
  {
    path: '',
    component: SignInComponent,
  },
];

@NgModule({
  declarations: [SignInComponent],
  imports: [
    RouterModule.forChild(route),
    MatCardModule,
    MatFormField,
    MatInputModule,
    MatButtonModule,
  ],
  exports: [RouterModule, SignInComponent],
  providers: [],
})
export class SignInModule {}
