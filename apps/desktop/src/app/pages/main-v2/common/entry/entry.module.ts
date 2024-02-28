import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntryComponent } from './entry.component';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { IdeaComponent } from './idea/idea.component';
import { TuiRadioBlockModule } from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';
import { TUI_BUTTON_OPTIONS, TuiButtonModule } from '@taiga-ui/core';

@NgModule({
  declarations: [EntryComponent, IdeaComponent],
  imports: [
    CommonModule,
    RecommendationModule,
    ReactiveFormsModule,
    TuiRadioBlockModule,
    TuiButtonModule,
  ],
  exports: [EntryComponent],
})
export class EntryModule {}
