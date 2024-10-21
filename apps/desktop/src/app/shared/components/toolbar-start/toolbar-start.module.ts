import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ToolbarLogoModule } from '../toolbar-logo/toolbar-logo.module';
import { ToolbarStartComponent } from './toolbar-start.component';

@NgModule({
  declarations: [ToolbarStartComponent],
  imports: [CommonModule, MatToolbarModule, RouterModule, MatButtonModule, ToolbarLogoModule],
  exports: [ToolbarStartComponent],
})
export class ToolbarStartModule {}
