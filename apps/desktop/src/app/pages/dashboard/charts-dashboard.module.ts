import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { VtCandleChartModule } from '../shared/candle-chart/candle-chart.module';
import { SecondRoutingModule } from './charts-dashboard-routing.module';
import { ChartsDashboardComponent } from './charts-dashboard.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [ChartsDashboardComponent],
  imports: [
    CommonModule,
    SharedModule,
    SecondRoutingModule,
    VtCandleChartModule,
  ],
  exports: [ChartsDashboardComponent],
  providers: [],
})
export class ChartsDashboardModule {}
