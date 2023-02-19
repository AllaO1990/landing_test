import { Directive } from '@angular/core';

@Directive({
  selector: '[vtWidgetToolbar]',
  host: {
    class: 'vt-widget-toolbar-start-wrapper',
  },
})
export class WidgetToolbarDirective {
  constructor() {}
}
