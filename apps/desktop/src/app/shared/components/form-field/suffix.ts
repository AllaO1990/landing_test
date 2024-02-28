import { Directive, InjectionToken } from '@angular/core';

export const VT_SUFFIX = new InjectionToken<VtSuffixDirective>('VtSuffix');

@Directive({
  selector: '[vtSuffix]',
  providers: [{ provide: VT_SUFFIX, useExisting: VtSuffixDirective }],
})
export class VtSuffixDirective {
  constructor() {}
}
