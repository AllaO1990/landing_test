import { CdkTableModule } from '@angular/cdk/table';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { VtIdeaModule } from '../idea/idea.module';
import { VtTableWidgetComponent } from './table.component';

@NgModule({
  declarations: [VtTableWidgetComponent],
  imports: [SharedModule, ReactiveFormsModule, CdkTableModule, VtIdeaModule],
  exports: [VtTableWidgetComponent],
})
export class VtTableWidgetModule {}
