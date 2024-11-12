import { TuiMultiSelectModule } from '@taiga-ui/legacy';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  NgZone,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { TuiBadge, TuiBadgedContent, TuiBadgedContentComponent } from '@taiga-ui/kit';
import { TuiButton, TuiDataList, TuiDropdown, TuiGroup } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { map, take } from 'rxjs/operators';
import { defer, Observable, shareReplay, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IsDisabledStatePipe } from '@ui/pipes/is-disabled-state.pipe';

@Component({
  selector: 'lib-button-with-list',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    TuiButton,
    TuiDataList,
    TuiMultiSelectModule,
    TuiDropdown,
    TuiActiveZone,
    TuiObscured,
    FormsModule,
    TuiBadgedContent,
    ReactiveFormsModule,
    AsyncPipe,
    TuiGroup,
    IsDisabledStatePipe,
    TuiBadge,
  ],
  templateUrl: './button-with-list.component.html',
  styleUrl: './button-with-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ButtonWithListComponent),
      multi: true,
    },
  ],
})
export class ButtonWithListComponent<T> implements ControlValueAccessor, OnInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _ngZone: NgZone = inject(NgZone);
  private _controlOpen = false;

  value: any = null;
  disabled = false;
  private onChange = (value: any) => {};
  private onTouched = () => {};

  @ViewChild(TuiBadgedContentComponent, { static: true }) badge!: TuiBadgedContentComponent;

  @Input() list: { name: string; disabled: boolean }[] = [];

  @Input() icon = '';

  @Output() opened: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output() toggled: EventEmitter<boolean> = new EventEmitter<boolean>();

  get controlOpen() {
    return this._controlOpen;
  }

  set controlOpen(value: boolean) {
    if (this._controlOpen !== value) {
      this._controlOpen = value;
      this.opened.emit(value);

      if (!value) {
        this.onChange(this.value);
      }
    }
  }

  appearance: 'primary' | 'secondary' = 'secondary';

  control: FormControl<T[] | null> = new FormControl(null);

  readonly length$: Observable<number> = defer(() => {
    if (this.badge) {
      return this.control.valueChanges.pipe(
        startWith(this.control.value),
        map((value: T[] | null) => (value && value.length) || 0),
        shareReplay(1)
      );
    }

    return this._ngZone.onStable.asObservable().pipe(
      take(1),
      switchMap((_) => this.length$)
    );
  });

  ngOnInit() {
    this.control.valueChanges.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((res) => {
      this.value = res;
    });

    this.length$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((res) => (this.appearance = res === 0 ? 'secondary' : 'primary'));
  }

  writeValue(obj: any): void {
    this.value = obj;
    this.control.patchValue(obj, { emitEvent: true });
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

  onOpenMore(): void {
    this.controlOpen = !this.controlOpen;
  }

  onObscuredMore(obscured: boolean): void {
    if (obscured) {
      this.controlOpen = false;
    }
  }

  onActiveZoneMore(active: boolean): void {
    this.controlOpen = active && this.controlOpen;
  }

  onToggle(event: Event): void {
    event.preventDefault();

    if (this.appearance === 'primary') {
      this.value = [];
      this.onChange([]);
      this.appearance = 'secondary';
      this.toggled.emit(false);
      return;
    }

    if (this.control.value && this.control.value.length === 0) {
      return;
    }

    this.onChange(this.control.value);
    this.appearance = 'primary';
    this.toggled.emit(true);
  }
}
