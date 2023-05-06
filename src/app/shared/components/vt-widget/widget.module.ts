import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetComponent } from './widget.component';
import { WidgetToolbarDirective } from './widget-toolbar.directive';

@NgModule({
  declarations: [WidgetComponent, WidgetToolbarDirective],
  imports: [CommonModule],
  exports: [WidgetComponent, WidgetToolbarDirective],
})
export class VtWidgetModule {}
