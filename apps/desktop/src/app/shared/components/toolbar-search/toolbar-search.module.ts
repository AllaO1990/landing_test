import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToolbarLogoModule } from '../toolbar-logo/toolbar-logo.module';
import { ToolbarSearchComponent } from './toolbar-search.component';

@NgModule({
  declarations: [ToolbarSearchComponent],
  imports: [CommonModule, ToolbarLogoModule, RouterModule],
  exports: [ToolbarSearchComponent],
})
export class ToolbarSearchModule {}
