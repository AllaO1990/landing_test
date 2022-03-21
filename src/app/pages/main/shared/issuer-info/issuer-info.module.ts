import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { IssuerInfoComponent } from './issuer-info.component';

@NgModule({
  declarations: [IssuerInfoComponent],
  exports: [IssuerInfoComponent],
  imports: [SharedModule, ReactiveFormsModule],
})
export class IssuerInfoModule {}
