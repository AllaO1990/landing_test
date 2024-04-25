import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RecommendationComponent } from './recommendation.component';
import {
  RecommendationHeaderDirective,
  RecommendationItemDirective,
} from './recommendation.directive';

@NgModule({
  declarations: [
    RecommendationComponent,
    RecommendationItemDirective,
    RecommendationHeaderDirective,
  ],
  imports: [CommonModule, ScrollingModule],
  exports: [
    RecommendationComponent,
    RecommendationItemDirective,
    RecommendationHeaderDirective,
  ],
})
export class RecommendationModule {}
