import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { VtStarRatingComponent } from './star-rating.component';

@NgModule({
  declarations: [VtStarRatingComponent],
  imports: [CommonModule],
  exports: [VtStarRatingComponent],
})
export class VtStarRatingModule {}
