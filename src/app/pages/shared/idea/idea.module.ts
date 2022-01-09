import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';

import { VtIdeaComponent } from './idea.component';

@NgModule({
  imports: [SharedModule, ReactiveFormsModule],
  exports: [],
  declarations: [VtIdeaComponent],
  providers: [],
})
export class VtIdeaModule {}
