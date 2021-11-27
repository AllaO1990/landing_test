import { Directive } from '@angular/core';

@Directive({
  selector: '[vtWidgetToolbar]',
  host: {
    class: 'vt-widget-toolbar-wrapper',
  },
})
export class WidgetToolbarDirective {
  constructor() {}
}
