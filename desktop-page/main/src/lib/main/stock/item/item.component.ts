import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  HostListener,
  inject,
  Input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'vt-stock-list-item',
  standalone: true,
  templateUrl: './item.component.html',
  host: {
    '[attr.checked]': 'checked || null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StockListItemComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockListItemComponent<T = any> implements ControlValueAccessor {
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  onChange = (v: any) => {};
  onTouched = () => {};

  @Input() disabled = false;
  @Input() checked = false;
  @Input() value: T | null = null;

  @HostListener('click', ['$event'])
  public onClick(event: Event): void {
    event.preventDefault();

    this.onChecked(!this.checked);
  }

  onChecked(checked: boolean): void {
    this.checked = checked;
    this.onChange(this.value);
  }

  writeValue(obj: T | null): void {
    this.checked = obj === this.value;
    this._cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
