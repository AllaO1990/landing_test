import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { WidgetToolbarDirective } from './widget-toolbar.directive';
import { WidgetComponent } from './widget.component';

@NgModule({
  declarations: [WidgetComponent, WidgetToolbarDirective],
  imports: [CommonModule],
  exports: [WidgetComponent, WidgetToolbarDirective],
})
export class VtWidgetModule {}
