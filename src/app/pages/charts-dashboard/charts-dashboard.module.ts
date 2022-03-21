import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { VtCandleChartModule } from '../shared/candle-chart/candle-chart.module';
import { SecondRoutingModule } from './charts-dashboard-routing.module';
import { ChartsDashboardComponent } from './charts-dashboard.component';

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
