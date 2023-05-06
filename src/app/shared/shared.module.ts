import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatSelectModule} from '@angular/material/select';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {VtChipModule} from './components/chip/chip.module';
import {VtFormFieldModule} from './components/form-field/form-field.module';
import {VtInputModule} from './components/input/input.module';
import {VtRadarChartModule} from './components/radar-chart/radar-chart.module';
import {VtStarRatingModule} from './components/star-rating/star-rating.module';
import {VtWidgetModule} from './components/vt-widget/widget.module';

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
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatGridListModule,
    VtFormFieldModule,
    VtInputModule,
    VtWidgetModule,
    VtRadarChartModule,
    VtChipModule,
    VtStarRatingModule,
    MatDialogModule,
    MatSelectModule,
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
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatGridListModule,
    VtFormFieldModule,
    VtInputModule,
    VtWidgetModule,
    VtRadarChartModule,
    VtChipModule,
    VtStarRatingModule,
    MatDialogModule,
    MatSelectModule,
  ],
  providers: [],
})
export class SharedModule {
}
