import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { VtCandleChartModule } from '../shared/candle-chart/candle-chart.module';
import { VtScreenerWidgetModule } from '../shared/screener/screener.module';
import { VtTableWidgetModule } from '../shared/table-widget/table.module';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { IssuerInfoModule } from './shared/issuer-info/issuer-info.module';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiGroupModule,
  TuiHostedDropdownModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { TuiBadgeModule, TuiItemsWithMoreModule } from '@taiga-ui/kit';

@NgModule({
  declarations: [MainComponent],
  imports: [
    SharedModule,
    MainRoutingModule,
    IssuerInfoModule,
    VtTableWidgetModule,
    VtCandleChartModule,
    VtScreenerWidgetModule,
    TuiGroupModule,
    TuiButtonModule,
    TuiItemsWithMoreModule,
    TuiDataListModule,
    TuiSvgModule,
    TuiBadgeModule,
    TuiHostedDropdownModule,
  ],
  exports: [],
  providers: [],
})
export class MainModule {}
