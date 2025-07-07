import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, forwardRef, inject } from '@angular/core';
import { TuiDataList, TuiTextfield } from '@taiga-ui/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, NgIf } from '@angular/common';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { map, Observable, startWith, tap } from 'rxjs';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { ApiService } from '../common/api.service';
import { Response } from 'types/response';
import { LoaderComponent } from '@ui/components/loader';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type Item = {
  id: number;
  name: string;
};

@Component({
  selector: 'trade-filter',
  standalone: true,
  imports: [
    TuiTextfield,
    ReactiveFormsModule,
    TuiDataList,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    NgIf,
    AsyncPipe,
    LoaderComponent,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements ControlValueAccessor, AfterViewInit {
  readonly #apiService: ApiService = inject(ApiService);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  #onChange = (_: any) => {};
  #onTouched = () => {};

  readonly size = 's';
  readonly sources$: Observable<Item[]> = this.#apiService.getSources().pipe(
    map((response: Response<Item[]>): Item[] => response.data),
    tap((list: Item[]) => list[0] && this.formGroup.patchValue({ source: list[0] }))
  );
  readonly formGroup: FormGroup = new FormGroup({
    instrument: new FormControl(null),
    source: new FormControl<Item | null>(null),
  });
  
  readonly stringifySource: TuiStringHandler<Item> = (item: Item) => item.name;

  isDisabled = false;

  writeValue(obj: any): void {
    this.formGroup.patchValue(obj);
  }

  registerOnChange(fn: any): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.#onChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.isDisabled !== isDisabled) {
      this.formGroup[isDisabled ? 'disable' : 'enable']();
    }

    this.isDisabled = isDisabled;
  }

  ngAfterViewInit(): void {
    this.formGroup.valueChanges
      .pipe(startWith(this.formGroup.value), takeUntilDestroyed(this.#destroyRef))
      .subscribe((value) => {
        this.#onChange(value);
      });
  }
}
