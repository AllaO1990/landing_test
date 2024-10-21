import { Directive } from '@angular/core';

@Directive({
  selector: '[vtWidgetToolbar]',
  host: {
    class: 'vt-vt-widget-nav-search-start-wrapper',
  },
})
export class WidgetToolbarDirective {
  constructor() {}
}
