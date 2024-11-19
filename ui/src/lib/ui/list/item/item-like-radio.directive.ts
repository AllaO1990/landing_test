import { Directive, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ItemBaseLike } from './item.like';

@Directive({
  selector: 'lib-list-item[libItemLikeRadio]',
  exportAs: 'libItemLikeRadio',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemLikeRadioDirective),
      multi: true,
    },
  ],
})
export class ItemLikeRadioDirective<TValue> extends ItemBaseLike implements ControlValueAccessor {
  @Input() value: TValue | null = null;

  writeValue(obj: any): void {
    this.checked = this.value === obj;
  }
}
