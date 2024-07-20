import { Directive, ElementRef, inject, Input } from '@angular/core';
import { Price } from './price';

@Directive({
  selector: '[uiPriceColor]:not(ng-container)',
  standalone: true,
})
export class ColorPriceDirective extends Price {
  private readonly _host: ElementRef<HTMLElement> = inject(ElementRef);

  @Input('uiPriceColor') set color(value: string | number | null) {
    const element = this._host.nativeElement;

    if (!value) {
      this.removeClass(element);
      return;
    }

    const calc = Number(value);

    if (calc === 0) {
      this.removeClass(element);
      return;
    }

    this.updateClass(element, calc > 0);
  }
}
