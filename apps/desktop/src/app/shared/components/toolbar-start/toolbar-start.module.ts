import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarStartComponent } from './toolbar-start.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ToolbarLogoModule } from '../toolbar-logo/toolbar-logo.module';

@NgModule({
  declarations: [ToolbarStartComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    RouterModule,
    MatButtonModule,
    ToolbarLogoModule,
  ],
  exports: [ToolbarStartComponent],
})
export class ToolbarStartModule {}
