import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToolbarStartModule } from '../toolbar-start';
import { LayoutStartComponent } from './layout-start.component';

@NgModule({
  declarations: [LayoutStartComponent],
  imports: [CommonModule, RouterModule, ToolbarStartModule],
})
export class LayoutStartModule {}
