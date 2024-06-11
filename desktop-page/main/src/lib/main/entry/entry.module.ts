import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntryComponent } from './entry.component';
import { EntryIdeaComponent } from './idea/idea.component';
import { ReactiveFormsModule } from '@angular/forms';
import {
  TuiButtonModule,
  TuiDropdownModule,
  TuiFormatNumberPipeModule,
  TuiLoaderModule,
  TuiScrollbarModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TuiFilterModule, TuiInputModule } from '@taiga-ui/kit';
import { EntryTableComponent } from './table/table.component';
import { TuiActiveZoneModule, TuiObscuredModule } from '@taiga-ui/cdk';

@NgModule({
  declarations: [EntryComponent, EntryIdeaComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiFilterModule,
    TuiScrollbarModule,
    TuiFormatNumberPipeModule,
    TuiLoaderModule,
    TuiButtonModule,
    ScrollingModule,
    EntryTableComponent,
    TuiDropdownModule,
    TuiActiveZoneModule,
    TuiObscuredModule,
    TuiInputModule,
    TuiTextfieldControllerModule,
  ],
  providers: [],
  exports: [EntryComponent],
})
export class EntryModule {}
