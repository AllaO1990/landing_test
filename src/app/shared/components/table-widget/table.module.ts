import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VtTableWidgetComponent } from './table.component';
import { CdkTableModule } from '@angular/cdk/table';
import { SharedModule } from '../../shared.module';

@NgModule({
  declarations: [VtTableWidgetComponent],
  imports: [SharedModule, CdkTableModule],
  exports: [VtTableWidgetComponent],
})
export class VtTableWidgetModule {}
