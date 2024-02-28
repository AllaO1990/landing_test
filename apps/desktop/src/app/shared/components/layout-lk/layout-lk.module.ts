import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutLkComponent } from './layout-lk.component';
import { ToolbarSearchModule } from '../toolbar-search';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [LayoutLkComponent],
  imports: [CommonModule, ToolbarSearchModule, RouterModule],
  exports: [LayoutLkComponent],
})
export class LayoutLkModule {}
