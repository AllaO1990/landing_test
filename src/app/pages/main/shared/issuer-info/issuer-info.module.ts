import { NgModule } from '@angular/core';
import { IssuerInfoComponent } from './issuer-info.component';
import { SharedModule } from '../../../../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [IssuerInfoComponent],
  exports: [IssuerInfoComponent],
  imports: [SharedModule, ReactiveFormsModule],
})
export class IssuerInfoModule {}
