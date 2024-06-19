import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Route, RouterModule } from '@angular/router';
import { SignUpComponent } from './sign-up.component';

const route: Route[] = [
  {
    path: '',
    component: SignUpComponent,
  },
];

@NgModule({
  declarations: [SignUpComponent],
  imports: [
    RouterModule.forChild(route),
    MatCardModule,
    MatFormField,
    MatInputModule,
    MatButtonModule,
  ],
  exports: [RouterModule, SignUpComponent],
  providers: [],
})
export class SignUpModule {}
