import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { NgModule } from '@angular/core';
import { OutComponent } from './out.component';
import { IdeaComponent } from './idea/idea.component';
import { OutTableComponent } from './table/table.component';
import { TuiBlock, TuiFilter } from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiDropdown } from '@taiga-ui/core';
import { TuiActiveZone, TuiAutoFocus, TuiObscured } from '@taiga-ui/cdk';
import { AsyncPipe } from '@angular/common';

@NgModule({
  declarations: [OutComponent, IdeaComponent],
  imports: [
    ReactiveFormsModule,
    OutTableComponent,
    TuiFilter,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiButton,
    ...TuiDropdown,
    TuiActiveZone,
    TuiObscured,
    AsyncPipe,
    TuiBlock,
    TuiAutoFocus,
  ],
  exports: [OutComponent],
})
export class OutModule {}
