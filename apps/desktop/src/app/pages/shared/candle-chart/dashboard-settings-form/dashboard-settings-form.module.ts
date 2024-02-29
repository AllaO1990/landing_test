import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VtDashboardSettingsFormComponent } from './dashboard-settings-form.component';
import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
  exports: [VtDashboardSettingsFormComponent],
  declarations: [VtDashboardSettingsFormComponent],
  providers: [],
})
export class VtDashboardSettingsFormModule {}
