import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TuiPopover, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiButton, TuiDataListComponent, TuiTextfield } from '@taiga-ui/core';
import { AsyncPipe, NgForOf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { combineLatest, debounceTime, distinctUntilChanged, filter, map, Observable, of, startWith } from 'rxjs';
import { TuiChevron, TuiDataListDropdownManager, TuiInputNumber, TuiSelect } from '@taiga-ui/kit';
import { TradeStore } from '../common/store';
import { TradeOrderTypes } from '../common/api.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getNumberPrecision } from 'utils/get-number-precision';

export interface RequestFormValue {
  direction: boolean;
  orderType: number;
  price: number;
  quantity: number;
  lot: number;
  lots: number;
}

@Component({
  selector: 'trade-request',
  standalone: true,
  imports: [
    TuiButton,
    NgForOf,
    ReactiveFormsModule,
    TuiDataListComponent,
    TuiInputDateModule,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    AsyncPipe,
    TuiInputNumber,
    TuiTextfield,
    TuiChevron,
    TuiSelect,
    TuiDataListDropdownManager,
  ],
  templateUrl: './request.component.html',
  styleUrls: ['../common/dialog.scss', './request.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestTradeComponent implements AfterViewInit {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #store: TradeStore = inject(TradeStore);
  readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  @tuiPure
  get max(): number | null {
    return this.#context.max || null;
  }

  @tuiPure
  get price(): number | null {
    return this.#context.price.value || null;
  }

  @tuiPure
  get lastPrice(): number | null {
    return this.#context.lastPrice.value || null;
  }

  readonly size = 's';
  readonly formGroup: FormGroup = new FormGroup({
    direction: new FormControl(null, Validators.required),
    orderType: new FormControl(null, Validators.required),
    price: new FormControl(null, Validators.required),
    quantity: new FormControl({ value: null, disabled: true }, Validators.required),
    lots: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    lot: new FormControl(null),
    total: new FormControl({ value: null, disabled: true }),
  });

  get controlDirection(): FormControl {
    return this.formGroup.get('direction') as FormControl;
  }

  get controlPrice(): FormControl {
    return this.formGroup.get('price') as FormControl;
  }

  get controlOrderType(): FormControl {
    return this.formGroup.get('orderType') as FormControl;
  }

  get controlLots(): FormControl {
    return this.formGroup.get('lots') as FormControl;
  }

  get controlQuantity(): FormControl {
    return this.formGroup.get('quantity') as FormControl;
  }

  get controlLot(): FormControl {
    return this.formGroup.get('lot') as FormControl;
  }

  get controlTotal(): FormControl {
    return this.formGroup.get('total') as FormControl;
  }

  types$: Observable<TradeOrderTypes | null> = this.#store.orderTypes$;

  actions$: Observable<{ name: string; id: boolean }[]> = of([
    { name: 'Купить', id: true },
    { name: 'Продать', id: false },
  ]);

  onCancel(event: Event): void {
    event.preventDefault();

    if (this.#context) {
      this.#context.completeWith(null);
    }
  }

  onSave(event: Event): void {
    event.preventDefault();

    if (this.#context) {
      this.#context.completeWith(this.formGroup.getRawValue());
    }
  }

  ngAfterViewInit(): void {
    if (this.#context) {
      const { orderType, direction, quantity, lot, price } = this.#context;
      const lots = Math.floor(quantity.value / lot.value);

      this._updateControl(this.controlDirection, direction, { onlySelf: true });
      this._updateControl(this.controlLots, { value: lots, disabled: quantity.disabled }, { onlySelf: true });
      this._updateControl(this.controlPrice, price, { onlySelf: true });
      this._updateControl(this.controlOrderType, orderType, { onlySelf: true });
      this._updateControl(this.controlLot, lot, { onlySelf: false });
    }

    this.controlOrderType.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.controlOrderType.value), distinctUntilChanged())
      .subscribe((value: number) => {
        if (value !== 1) {
          this.controlPrice.disable();
          this.controlPrice.patchValue(this.lastPrice);
        } else {
          this.controlPrice.enable();
          this.controlPrice.patchValue(this.price);
        }
      });

    this.controlLots.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.controlLots.value), distinctUntilChanged())
      .subscribe((value: number) => {
        this.controlQuantity.patchValue(value * this.controlLot.value);
      });

    combineLatest([
      this.controlQuantity.valueChanges.pipe(
        startWith(this.controlQuantity.value),
        filter((value: any) => value !== null)
      ),
      this.controlPrice.valueChanges.pipe(
        startWith(this.controlPrice.value),
        filter((value: any) => value !== null)
      ),
    ])
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        debounceTime(100),
        map(([quantity, price]: [any, any]) => getNumberPrecision(+quantity * +price, 2))
      )
      .subscribe((value) => this.controlTotal.patchValue(value));
  }

  @tuiPure
  protected stringifyActions(items: readonly { name: string; id: boolean }[]): TuiStringHandler<boolean> {
    const map = new Map(items.map(({ name, id }) => [id, name] as [boolean, string]));

    return (value: boolean) => map.get(value) || '';
  }

  @tuiPure
  protected stringifyTypes(items: TradeOrderTypes): TuiStringHandler<number> {
    const map = new Map(items.map(({ name, id }) => [id, name] as [number, string]));

    return (value: number) => map.get(value) || '';
  }

  private _updateControl<T = any>(
    control: FormControl,
    controlState: { value: T; disabled: boolean },
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
      emitModelToViewChange?: boolean;
      emitViewToModelChange?: boolean;
    }
  ): void {
    control.setValue(controlState.value, options);
    control[controlState.disabled ? 'disable' : 'enable'](options);
  }
}
