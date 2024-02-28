import { Directive, InjectionToken } from '@angular/core';

export const VT_PREFIX = new InjectionToken<VtPrefixDirective>('VtPrefix');

@Directive({
  selector: '[vtPrefix]',
  providers: [{ provide: VT_PREFIX, useExisting: VtPrefixDirective }],
})
export class VtPrefixDirective {
  constructor() {}
}
