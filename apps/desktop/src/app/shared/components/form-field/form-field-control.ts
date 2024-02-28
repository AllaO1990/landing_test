import { Directive } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Observable } from 'rxjs';

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
