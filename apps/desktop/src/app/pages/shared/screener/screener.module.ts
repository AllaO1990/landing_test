import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SharedModule } from '../../../shared/shared.module';
import { VtScreenerComponent } from './screener.component';

@NgModule({
  declarations: [VtScreenerComponent],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
  ],
  exports: [VtScreenerComponent],
})
export class VtScreenerWidgetModule {}
