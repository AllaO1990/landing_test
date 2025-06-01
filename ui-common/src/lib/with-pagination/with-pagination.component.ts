import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Input,
} from '@angular/core';
import { AsyncPipe, JsonPipe, NgIf } from '@angular/common';
import { TuiPagination } from '@taiga-ui/kit';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiTextfield } from '@taiga-ui/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { LoaderComponent } from '@ui/components/loader';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Observable,
  shareReplay,
  Subject,
  switchMap,
} from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type EventPagination = { page: number; limit: number };

@Component({
  selector: 'lib-with-pagination',
  standalone: true,
  imports: [
    AsyncPipe,
    TuiPagination,
    NgIf,
    TuiSelectModule,
    TuiTextfield,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    LoaderComponent,
    JsonPipe,
  ],
  templateUrl: './with-pagination.component.html',
  styleUrl: './with-pagination.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WithPaginationComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithPaginationComponent implements ControlValueAccessor, AfterViewInit {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  #onChange = (_: any) => {};
  #onTouched = () => {};
  #total$: Subject<number | null> = new BehaviorSubject<number | null>(0);
  #index$: Subject<number> = new BehaviorSubject<number>(0);
  #limit$: Subject<number> = new BehaviorSubject<number>(0);

  readonly size = 's';
  disabled = false;
  list: number[] = [];

  readonly formGroup = new FormGroup({
    limit: new FormControl(null),
    page: new FormControl(null),
  });

  controlLimit: FormControl = new FormControl(null);

  readonly length$: Observable<number | null> = combineLatest([
    this.#total$.asObservable(),
    this.#limit$.asObservable(),
  ]).pipe(
    debounceTime(0),
    map(([total, limit]: [number | null, number | null]) =>
      !limit || total === null ? null : Math.ceil(total / limit)
    ),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly index$: Observable<number> = this.#index$.asObservable();

  @Input() set items(value: number[]) {
    this.list = value;

    if (!this.controlLimit.value) {
      this.controlLimit.patchValue(this.list[0]);

      this.#limit$.next(this.list[0]);
    }
  }

  @Input() set total(value: number | null) {
    this.#total$.next(value);
  }

  writeValue(obj: any | EventPagination): void {
    if (obj && obj.page !== undefined && obj.limit !== undefined) {
      this.controlLimit.setValue(obj.limit);

      this.#limit$.next(obj.limit);
      this.#index$.next(obj.page);
    }
  }

  registerOnChange(fn: any): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;

    this.controlLimit[this.disabled ? 'disable' : 'enable']();
  }

  ngAfterViewInit(): void {
    this.length$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        switchMap((length: number | null) => this.index$.pipe(filter((index: number) => (length || 0) < index)))
      )
      .subscribe((_) => {
        this.#index$.next(0);
      });

    this.controlLimit.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((value: number) => this.#limit$.next(value));

    combineLatest([this.#limit$.asObservable(), this.#index$.asObservable()])
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        map(([limit, page]: [number, number]) => ({ limit, page })),
        debounceTime(0)
      )
      .subscribe((value) => this.#onChange(value));
  }

  goToPage(index: number): void {
    this.#index$.next(index);
  }
}
