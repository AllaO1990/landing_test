import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { IssuerInfoModule } from './shared/issuer-info/issuer-info.module';
import { VtTableWidgetModule } from '../shared/table-widget/table.module';
import { VtCandleChartModule } from '../shared/candle-chart/candle-chart.module';

@NgModule({
  declarations: [MainComponent],
  imports: [
    SharedModule,
    MainRoutingModule,
    IssuerInfoModule,
    VtTableWidgetModule,
    VtCandleChartModule,
  ],
  exports: [],
  providers: [],
})
export class MainModule {}
