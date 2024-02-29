import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SecondRoutingModule } from './charts-dashboard-routing.module';
import { ChartsDashboardComponent } from './charts-dashboard.component';
import { SharedModule } from '../../../../../apps/desktop/src/app/shared/shared.module';
import { VtCandleChartModule } from '../../../../../apps/desktop/src/app/pages/shared/candle-chart/candle-chart.module';

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
