import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {SharedModule} from '../../shared/shared.module';
import {LoginComponent} from './login.component';

const route: Route[] = [
  {
    path: '',
    component: LoginComponent,
  },
];

@NgModule({
  declarations: [LoginComponent],
  imports: [SharedModule, RouterModule.forChild(route)],
  exports: [RouterModule, LoginComponent],
  providers: [],
})
export class LoginModule {}
