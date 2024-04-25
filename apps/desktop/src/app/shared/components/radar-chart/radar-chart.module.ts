import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { VtRadarChartComponent } from './radar-chart.component';

@NgModule({
  declarations: [VtRadarChartComponent],
  exports: [VtRadarChartComponent],
  imports: [CommonModule],
})
export class VtRadarChartModule {}
