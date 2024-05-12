import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntryComponent } from './entry.component';
import { EntryIdeaComponent } from './idea/idea.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiFormatNumberPipeModule, TuiLoaderModule, TuiScrollbarModule } from '@taiga-ui/core';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TuiFilterModule } from '@taiga-ui/kit';

@NgModule({
  declarations: [EntryComponent, EntryIdeaComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiFilterModule,
    TuiTableModule,
    TuiScrollbarModule,
    TuiFormatNumberPipeModule,
    TuiLoaderModule,
    ScrollingModule,
  ],
  exports: [EntryComponent],
})
export class EntryModule {}
