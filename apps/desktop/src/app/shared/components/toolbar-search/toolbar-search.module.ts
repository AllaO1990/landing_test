import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarSearchComponent } from './toolbar-search.component';
import { ToolbarLogoModule } from '../toolbar-logo/toolbar-logo.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [ToolbarSearchComponent],
  imports: [CommonModule, ToolbarLogoModule, RouterModule],
  exports: [ToolbarSearchComponent],
})
export class ToolbarSearchModule {}
