import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { VtDashboardSettingsFormComponent } from './dashboard-settings-form.component';

@NgModule({
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
  exports: [VtDashboardSettingsFormComponent],
  declarations: [VtDashboardSettingsFormComponent],
  providers: [],
})
export class VtDashboardSettingsFormModule {}
