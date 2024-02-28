import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VtTableWidgetComponent } from './table.component';
import { CdkTableModule } from '@angular/cdk/table';
import { SharedModule } from '../../../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { VtIdeaModule } from '../idea/idea.module';

@NgModule({
  declarations: [VtTableWidgetComponent],
  imports: [SharedModule, ReactiveFormsModule, CdkTableModule, VtIdeaModule],
  exports: [VtTableWidgetComponent],
})
export class VtTableWidgetModule {}
