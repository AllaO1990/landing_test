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
import { TuiBadgedContentComponent, TuiBadgedContentModule, TuiMultiSelectModule } from '@taiga-ui/kit';
import { TuiButtonModule, TuiDataListModule, TuiDropdownModule } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiActiveZoneModule, TuiObscuredModule } from '@taiga-ui/cdk';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { PolymorpheusContent } from '@tinkoff/ng-polymorpheus';
import { map, take } from 'rxjs/operators';
import { defer, Observable, shareReplay, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-button-with-list',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    TuiButtonModule,
    TuiDataListModule,
    TuiMultiSelectModule,
    TuiDropdownModule,
    TuiActiveZoneModule,
    TuiObscuredModule,
    TuiDataListModule,
    TuiMultiSelectModule,
    FormsModule,
    TuiBadgedContentModule,
    ReactiveFormsModule,
    AsyncPipe,
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
export class ButtonWithListComponent implements ControlValueAccessor, OnInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _ngZone: NgZone = inject(NgZone);
  private _controlOpen = false;

  disabled = false;
  private onChange = (value: any) => {};
  private onTouched = () => {};

  @ViewChild(TuiBadgedContentComponent, { static: true }) badge!: TuiBadgedContentComponent;

  @Input() list: { name: string }[] = [];

  @Input() icon: PolymorpheusContent;

  @Output() opened: EventEmitter<boolean> = new EventEmitter<boolean>();

  get controlOpen() {
    return this._controlOpen;
  }

  set controlOpen(value: boolean) {
    this._controlOpen = value;
    this.opened.emit(value);
  }

  control: FormControl<{ name: string }[] | null> = new FormControl(null);

  readonly length$: Observable<number> = defer(() => {
    if (this.badge) {
      return this.control.valueChanges.pipe(
        shareReplay(1),
        startWith(this.control.value),
        map((value: { name: string }[] | null) => (value && value.length) || 0)
      );
    }

    return this._ngZone.onStable.asObservable().pipe(
      take(1),
      switchMap((_) => this.length$)
    );
  });

  ngOnInit() {
    this.control.valueChanges.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((res) => this.onChange(res));
  }

  writeValue(obj: any): void {
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
}
