import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SharedModule } from 'src/app/shared/shared.module';
import { VtCandleChartComponent } from './candle-chart.component';
import { VtDashboardSettingsFormModule } from './dashboard-settings-form/dashboard-settings-form.module';

@NgModule({
  declarations: [VtCandleChartComponent],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    VtDashboardSettingsFormModule,
  ],
  exports: [VtCandleChartComponent],
})
export class VtCandleChartModule {}
