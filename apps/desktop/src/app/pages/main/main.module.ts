import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { VtCandleChartModule } from '../shared/candle-chart/candle-chart.module';
import { VtScreenerWidgetModule } from '../shared/screener/screener.module';
import { VtTableWidgetModule } from '../shared/table-widget/table.module';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { IssuerInfoModule } from './shared/issuer-info/issuer-info.module';
import { TuiDataList, TuiGroup, TuiDropdown, TuiIcon, TuiButton } from '@taiga-ui/core';
import { TuiItemsWithMore, TuiBadge } from '@taiga-ui/kit';

@NgModule({
  declarations: [MainComponent],
  imports: [
    SharedModule,
    MainRoutingModule,
    IssuerInfoModule,
    VtTableWidgetModule,
    VtCandleChartModule,
    VtScreenerWidgetModule,
    TuiGroup,
    TuiButton,
    ...TuiItemsWithMore,
    ...TuiDataList,
    TuiIcon,
    TuiBadge,
    ...TuiDropdown,
  ],
  exports: [],
  providers: [],
})
export class MainModule {}
