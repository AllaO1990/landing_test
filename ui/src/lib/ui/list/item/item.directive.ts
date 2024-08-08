import { Directive, inject, TemplateRef } from '@angular/core';
import { CdkVirtualForOfContext } from '@angular/cdk/scrolling';

@Directive({
  selector: '[libListItem]',
  standalone: true,
  providers: [],
})
export class ItemDirective<T = unknown> {
  public template: TemplateRef<CdkVirtualForOfContext<T>> = inject(TemplateRef);
}
