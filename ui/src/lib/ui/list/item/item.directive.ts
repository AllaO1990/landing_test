import { Directive, inject, TemplateRef } from '@angular/core';
import { CdkVirtualForOfContext } from '@angular/cdk/scrolling';

@Directive({
  selector: '[uiLibListItem]',
  standalone: true,
  providers: [],
})
export class UiListItem<T = unknown> {
  public template: TemplateRef<CdkVirtualForOfContext<T>> = inject(TemplateRef);
}
