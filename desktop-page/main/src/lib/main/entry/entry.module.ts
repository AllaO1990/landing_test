import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntryComponent } from './entry.component';
import { EntryIdeaComponent } from './idea/idea.component';
import { TuiRadioBlockModule } from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';
import {
  TuiButtonModule,
  TuiFormatNumberPipeModule,
  TuiLoaderModule,
  TuiScrollbarModule,
} from '@taiga-ui/core';
import { RecommendationModule } from '../../../../../../apps/desktop/src/app/pages/main-v2/common/recommendation/recommendation.module';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  declarations: [EntryComponent, EntryIdeaComponent],
  imports: [
    CommonModule,
    RecommendationModule,
    ReactiveFormsModule,
    TuiRadioBlockModule,
    TuiButtonModule,
    TuiTableModule,
    TuiScrollbarModule,
    TuiFormatNumberPipeModule,
    TuiLoaderModule,
    ScrollingModule,
  ],
  exports: [EntryComponent],
})
export class EntryModule {}
