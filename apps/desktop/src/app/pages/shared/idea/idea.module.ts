import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { VtCandleChartModule } from '../candle-chart/candle-chart.module';
import { VtIdeaComponent } from './idea.component';

@NgModule({
  imports: [SharedModule, ReactiveFormsModule, VtCandleChartModule],
  exports: [],
  declarations: [VtIdeaComponent],
  providers: [],
})
export class VtIdeaModule {}
