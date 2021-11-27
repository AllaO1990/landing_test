import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VtWidgetComponent } from './widget.component';
import { WidgetToolbarDirective } from './widget-toolbar.directive';

@NgModule({
  declarations: [VtWidgetComponent, WidgetToolbarDirective],
  imports: [CommonModule],
  exports: [VtWidgetComponent, WidgetToolbarDirective],
})
export class VtWidgetModule {}
