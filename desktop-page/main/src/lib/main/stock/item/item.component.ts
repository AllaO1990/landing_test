import { ChangeDetectionStrategy, Component, forwardRef, HostListener, Input } from '@angular/core';
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
export class StockListItemComponent implements ControlValueAccessor {
  onChange = (v: any) => {};
  onTouched = () => {};

  @Input() isDisabled = false;
  @Input() checked = false;

  @HostListener('click', ['$event'])
  public onClick(event: Event): void {
    event.preventDefault();

    this.onChecked(!this.checked);
  }

  onChecked(checked: boolean): void {
    this.checked = checked;
    this.onChange(this.checked);
  }

  writeValue(obj: any): void {
    console.log(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
