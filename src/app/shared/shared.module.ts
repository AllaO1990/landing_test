import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { VtFormFieldModule } from './components/form-field/form-field.module';
import { VtInputModule } from './components/input/input.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { VtWidgetModule } from './components/widget/widget.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { VtRadarChartModule } from './components/radar-chart/radar-chart.module';
import { VtChipModule } from './components/chip/chip.module';
import { VtStarRatingModule } from './components/star-rating/star-rating.module';
import { VtCandleChartModule } from './components/candle-chart/candle-chart.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatGridListModule,
    VtFormFieldModule,
    VtInputModule,
    VtWidgetModule,
    VtCandleChartModule,
    VtRadarChartModule,
    VtChipModule,
    VtStarRatingModule,
  ],
  exports: [
    CommonModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatGridListModule,
    VtFormFieldModule,
    VtInputModule,
    VtWidgetModule,
    VtCandleChartModule,
    VtRadarChartModule,
    VtChipModule,
    VtStarRatingModule,
  ],
  providers: [],
})
export class SharedModule {}
