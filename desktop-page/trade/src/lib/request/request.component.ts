import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TuiContext, TuiPopover, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiButton, TuiDataListComponent, TuiDataListDirective, TuiTextfield } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { distinctUntilChanged, Observable, of, startWith } from 'rxjs';
import { TuiInputNumber } from '@taiga-ui/kit';
import { TradeStore } from '../common/store';
import { TradeOrderTypes } from '../common/api.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface RequestFormValue {
  direction: boolean;
  orderType: number;
  price: number;
  quantity: number;
}

@Component({
  selector: 'trade-request',
  standalone: true,
  imports: [
    TuiButton,
    NgForOf,
    ReactiveFormsModule,
    TuiDataListComponent,
    TuiDataListDirective,
    TuiInputDateModule,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    AsyncPipe,
    NgIf,
    TuiInputNumber,
    TuiTextfield,
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
  get lot(): number {
    return this.#context.lot;
  }

  readonly size = 's';
  readonly formGroup: FormGroup = new FormGroup({
    direction: new FormControl({ value: null, disabled: true }, Validators.required),
    orderType: new FormControl(null, Validators.required),
    price: new FormControl(null, Validators.required),
    quantity: new FormControl({ value: null, disabled: true }, Validators.required),
  });

  get controlPrice(): FormControl {
    return this.formGroup.get('price') as FormControl;
  }

  get controlOrderType(): FormControl {
    return this.formGroup.get('orderType') as FormControl;
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
      const { orderType, direction, quantity, price } = this.#context;

      this.formGroup.patchValue({
        direction: direction !== undefined && direction,
        quantity,
        orderType,
        price,
      });
    }

    this.controlOrderType.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.controlOrderType.value), distinctUntilChanged())
      .subscribe((value: number) => {
        this.controlPrice[value !== 1 ? 'disable' : 'enable']();
      });
  }

  @tuiPure
  protected stringifyActions(items: readonly { name: string; id: boolean }[]): TuiStringHandler<TuiContext<boolean>> {
    const map = new Map(items.map(({ name, id }) => [id, name] as [boolean, string]));

    return ({ $implicit }: TuiContext<boolean>) => map.get($implicit) || '';
  }

  @tuiPure
  protected stringifyTypes(items: TradeOrderTypes): TuiStringHandler<TuiContext<number>> {
    const map = new Map(items.map(({ name, id }) => [id, name] as [number, string]));

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }
}
