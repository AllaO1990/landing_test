import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListComponent } from './list.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  declarations: [ListComponent],
  imports: [CommonModule, ScrollingModule],
  exports: [ListComponent],
})
export class ListModule {}
