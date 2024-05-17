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
import { TuiTableModule } from '@taiga-ui/addon-table';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TuiFilterModule, TuiInputModule } from '@taiga-ui/kit';
import { TableComponent } from './table/table.component';
import { TuiActiveZoneModule, TuiObscuredModule } from '@taiga-ui/cdk';

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
    TuiButtonModule,
    ScrollingModule,
    TableComponent,
    TuiDropdownModule,
    TuiActiveZoneModule,
    TuiObscuredModule,
    TuiInputModule,
    TuiTextfieldControllerModule,
  ],
  exports: [EntryComponent],
})
export class EntryModule {}
