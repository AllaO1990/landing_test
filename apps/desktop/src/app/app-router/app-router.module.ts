import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { AppRouterRoutingModule } from './app-router-routing.module';
import { AppRouterComponent } from './app-router.component';

@NgModule({
  declarations: [AppRouterComponent],
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    AppRouterRoutingModule,
  ],
  exports: [AppRouterComponent],
  providers: [],
})
export class AppRouterModule {}
