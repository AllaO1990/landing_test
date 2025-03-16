import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, NgZone } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { PolymorpheusContent, PolymorpheusOutlet } from '@taiga-ui/polymorpheus';
import { TuiChip } from '@taiga-ui/kit';
import { TuiButton } from '@taiga-ui/core';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { TuiContext } from '@taiga-ui/cdk/types/context';
import { BehaviorSubject, defer, Observable, of, shareReplay, startWith, Subject, switchMap, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'lib-filter-chip',
  standalone: true,
  imports: [TuiChip, TuiButton, PolymorpheusOutlet, AsyncPipe],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent<T> implements ControlValueAccessor {
  readonly #control: NgControl = inject(NgControl);
  readonly #ngZone: NgZone = inject(NgZone);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #disable$: Subject<boolean> = new BehaviorSubject<boolean>(false);

  value: any;

  onChange = (v: any) => {};
  onTouched = () => {};

  @Input() valueDefault: T | null = null;
  @Input() valueContent: PolymorpheusContent = '';
  @Input() stringify: TuiStringHandler<T> = String;

  get computedValue(): string {
    return this.value === null ? '' : this.stringify(this.value) || ' ';
  }

  get computedContent(): PolymorpheusContent<TuiContext<T>> {
    return this.valueContent || this.computedValue;
  }

  readonly valueChanged: Observable<any> = defer(() => {
    if (this.#control && this.#control.valueChanges) {
      return this.#control.valueChanges.pipe(startWith(this.#control.value), takeUntilDestroyed(this.#destroyRef));
    }

    return this.#ngZone.onStable.asObservable().pipe(
      take(1),
      switchMap(() => this.valueChanged)
    );
  });

  readonly isDisabled$: Observable<boolean> = this.#disable$.asObservable().pipe(
    switchMap((value: boolean) => {
      if (value) {
        return of(true);
      }
      return this.valueChanged.pipe(map((value: T) => JSON.stringify(this.valueDefault) === JSON.stringify(value)));
    }),
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  constructor() {
    if (this.#control) {
      this.#control.valueAccessor = this;
    }
  }

  writeValue(obj: any): void {
    this.#disable$.next(this.valueDefault === obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.#disable$.next(isDisabled);
  }

  onReset(event: Event): void {
    event.preventDefault();

    this.onChange(this.valueDefault);
    this.onTouched();
  }
}
