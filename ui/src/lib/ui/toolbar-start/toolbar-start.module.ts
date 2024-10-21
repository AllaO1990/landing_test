import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ToolbarStartComponent } from './toolbar-start.component';
import { LogoComponent } from '../logo';

@NgModule({
  declarations: [ToolbarStartComponent],
  imports: [CommonModule, MatToolbarModule, RouterModule, MatButtonModule, LogoComponent],
  exports: [ToolbarStartComponent],
})
export class ToolbarStartModule {}
