import { Directive } from '@angular/core';
import { Observable } from 'rxjs';
import { NgControl } from '@angular/forms';

@Directive()
export abstract class VtFormFieldControl<T = any> {
  value!: T | null;

  readonly stateChanges!: Observable<void>;

  readonly id!: string;

  readonly placeholder!: string;

  readonly ngControl!: NgControl | null;

  readonly focused!: boolean;

  readonly empty!: boolean;

  readonly required!: boolean;

  readonly disabled!: boolean;

  readonly errorState!: boolean;

  abstract onContainerClick(event: MouseEvent): void;
}
