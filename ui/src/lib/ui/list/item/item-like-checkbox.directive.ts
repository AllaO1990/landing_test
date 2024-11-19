import { Directive, forwardRef, HostListener } from '@angular/core';
import { ItemBaseLike } from './item.like';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'lib-list-item[libItemLikeCheckbox], [libListItem][libItemLikeCheckbox]',
  exportAs: 'libItemLikeCheckbox',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemLikeCheckboxDirective),
      multi: true,
    },
  ],
})
export class ItemLikeCheckboxDirective extends ItemBaseLike implements ControlValueAccessor {
  @HostListener('click', ['$event']) onClick(event: Event): void {
    event.preventDefault();

    if (this.disabled) {
      return;
    }

    this.checked = !this.checked;
    this.onChange(this.checked);
  }

  writeValue(obj: boolean): void {
    this.checked = obj;
  }
}
