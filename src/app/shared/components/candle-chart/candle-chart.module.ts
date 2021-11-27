import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VtCandleChartComponent } from './candle-chart.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@NgModule({
  declarations: [VtCandleChartComponent],
  imports: [CommonModule, ReactiveFormsModule, MatAutocompleteModule],
  exports: [VtCandleChartComponent],
})
export class VtCandleChartModule {}
