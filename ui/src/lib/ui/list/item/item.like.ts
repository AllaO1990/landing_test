import { Directive, Input } from '@angular/core';

@Directive()
export class ItemBaseLike {
  @Input() disabled = false;

  @Input() checked = false;

  onChange = (_: any) => {};
  onTouched = () => {};

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
