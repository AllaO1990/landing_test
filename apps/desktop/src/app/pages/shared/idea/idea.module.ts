import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { VtCandleChartModule } from '../candle-chart/candle-chart.module';
import { VtIdeaComponent } from './idea.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [SharedModule, ReactiveFormsModule, VtCandleChartModule],
  exports: [],
  declarations: [VtIdeaComponent],
  providers: [],
})
export class VtIdeaModule {}
