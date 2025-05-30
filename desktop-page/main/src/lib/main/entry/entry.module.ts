import { TuiInputModule, TuiMultiSelectModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntryComponent } from './entry.component';
import { EntryIdeaComponent } from './idea/idea.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiDropdown, TuiFormatNumberPipe, TuiLoader, TuiScrollbar } from '@taiga-ui/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { EntryTableComponent } from './table/table.component';
import { TuiActiveZone, TuiAutoFocus, TuiObscured } from '@taiga-ui/cdk';
import { TuiDataListWrapperComponent, TuiFilter } from '@taiga-ui/kit';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';

@NgModule({
  declarations: [EntryComponent, EntryIdeaComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiFilter,
    TuiScrollbar,
    TuiFormatNumberPipe,
    TuiLoader,
    TuiButton,
    ScrollingModule,
    EntryTableComponent,
    ...TuiDropdown,
    TuiActiveZone,
    TuiObscured,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiAutoFocus,
    TuiDataListWrapperComponent,
    TuiSelectModule,
    TuiMultiSelectModule,
    SearchDialogDirective,
    WithPaginationComponent,
  ],
  providers: [],
  exports: [EntryComponent],
})
export class EntryModule {}
