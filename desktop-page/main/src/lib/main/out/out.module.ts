import { NgModule } from '@angular/core';
import { OutComponent } from './out.component';
import { IdeaComponent } from './idea/idea.component';
import { OutTableComponent } from './table/table.component';
import { TuiFilterModule, TuiInputModule } from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';
import {
  TuiButtonModule,
  TuiDropdownModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { TuiActiveZoneModule, TuiObscuredModule } from '@taiga-ui/cdk';

@NgModule({
  declarations: [OutComponent, IdeaComponent],
  imports: [
    ReactiveFormsModule,
    OutTableComponent,
    TuiFilterModule,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiButtonModule,
    TuiDropdownModule,
    TuiActiveZoneModule,
    TuiObscuredModule,
  ],
  exports: [OutComponent],
})
export class OutModule {}
