import { Directive, ElementRef, inject, Input } from '@angular/core';
import { WithLastPrice } from 'types/stock';
import { Price } from './price';

@Directive({
  selector: '[uiLastPrice]:not(ng-container)',
  standalone: true,
})
export class LastPriceDirective extends Price {
  private readonly _host: ElementRef<HTMLElement> = inject(ElementRef);

  @Input('uiLastPrice')
  set price(value: WithLastPrice | null) {
    const element = this._host.nativeElement;

    if (!value || (!value.last && !value.prev)) {
      this.removeClass(element);
      return;
    }

    const calc = value.last - value.prev;

    if (calc === 0) {
      this.removeClass(element);
      return;
    }

    this.updateClass(element, calc > 0);
  }
}
