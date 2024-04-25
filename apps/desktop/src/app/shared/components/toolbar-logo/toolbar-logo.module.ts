import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToolbarLogoComponent } from './toolbar-logo.component';

@NgModule({
  declarations: [ToolbarLogoComponent],
  imports: [CommonModule, RouterModule],
  exports: [ToolbarLogoComponent],
})
export class ToolbarLogoModule {}
