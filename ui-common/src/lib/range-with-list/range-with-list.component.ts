import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Input,
} from '@angular/core';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiDataList, TuiGroup, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { TuiInputDateRangeModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiSizeL, TuiSizeS } from '@taiga-ui/core/types';
import { NgForOf, NgIf } from '@angular/common';
import { TuiChevron } from '@taiga-ui/kit';
import { PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { TuiHandler } from '@taiga-ui/cdk/types/handler';
import { TuiDayRange } from '@taiga-ui/cdk';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-range-with-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TuiGroup,
    TuiInputDateRangeModule,
    TuiTextfieldOptionsDirective,
    TuiTextfieldControllerModule,
    NgForOf,
    TuiChevron,
    TuiButton,
    TuiDataList,
    NgIf,
  ],
  templateUrl: './range-with-list.component.html',
  styleUrl: './range-with-list.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RangeWithListComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeWithListComponent<T> implements ControlValueAccessor, AfterViewInit {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  size: TuiSizeL | TuiSizeS = 's';
  isOpenRangeList = false;
  isDisabled = false;

  onChange = (v: any) => {};
  onTouched = () => {};

  readonly controlRange: FormControl = new FormControl(null);

  @Input() itemContent: PolymorpheusContent<any>;

  @Input() selectHandler: TuiHandler<T, any> = (d: T) => d;

  @Input() items: T[] = [];

  ngAfterViewInit(): void {
    this.controlRange.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result: TuiDayRange) => this.onChange(result));
  }

  writeValue(obj: TuiDayRange): void {
    this.controlRange.setValue(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.controlRange[isDisabled ? 'disable' : 'enable']();
  }

  onSelect(event: Event, item: T): void {
    event.stopPropagation();

    this.controlRange.patchValue(this.selectHandler(item));
    this.isOpenRangeList = false;
  }
}
