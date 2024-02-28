import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OutComponent } from './out.component';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { IdeaComponent } from './idea/idea.component';

@NgModule({
  declarations: [OutComponent, IdeaComponent],
  imports: [CommonModule, RecommendationModule],
  exports: [OutComponent],
})
export class OutModule {}
