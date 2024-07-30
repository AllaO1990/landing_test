import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { VtCandleChartModule } from '../shared/candle-chart/candle-chart.module';
import { VtScreenerWidgetModule } from '../shared/screener/screener.module';
import { VtTableWidgetModule } from '../shared/table-widget/table.module';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { IssuerInfoModule } from './shared/issuer-info/issuer-info.module';
import { ToolbarComponent } from './shared/toolbar/toolbar.component';
import { TuiButtonModule, TuiGroupModule, TuiSvgModule } from '@taiga-ui/core';

@NgModule({
  declarations: [MainComponent, ToolbarComponent],
  imports: [
    SharedModule,
    MainRoutingModule,
    IssuerInfoModule,
    VtTableWidgetModule,
    VtCandleChartModule,
    VtScreenerWidgetModule,
    TuiGroupModule,
    TuiSvgModule,
    TuiButtonModule,
  ],
  exports: [],
  providers: [],
})
export class MainModule {}
