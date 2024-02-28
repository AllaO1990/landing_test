import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationComponent } from './recommendation.component';
import {
  RecommendationHeaderDirective,
  RecommendationItemDirective,
} from './recommendation.directive';
import { ScrollingModule } from '@angular/cdk/scrolling';

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
