import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
  signal,
  WritableSignal,
} from '@angular/core';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { TuiButtonLoading, TuiCheckbox, TuiChevron } from '@taiga-ui/kit';
import {
  ControlValueAccessor,
  FormArray,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiHint, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { TuiExpand } from '@taiga-ui/experimental';
import { TradeDialogService } from '../dialog/dialog.service';
import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { FilterComponent } from '../filter/filter.component';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { combineLatest, distinctUntilChanged, filter, map, Observable, startWith, switchMap, timer } from 'rxjs';
import { StockPosition, StockPositionActionTarget, StockPositionTarget } from 'types/position';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeStore } from '../common/store';
import { Params } from '@angular/router';
import { DirectionTypePipe } from '../common/direction-type.pipe';
import { OrderTypePipe } from '../common/order-type.pipe';
import { TradeOperations, TradeOrder, TradeOrders } from '../common/api.types';
import { getNumberPrecision } from 'utils/get-number-precision';
import { RequestFormValue } from '../request/request.component';
import { TradeFormService } from './form.service';
import { TuiItem } from '@taiga-ui/cdk';

interface ItemEntry {
  direction: boolean;
  instrumentId: string;
  orderType: number;
  price: number;
  status: number;
  orderId: string | null;
  lot: number;
  quantity: number;
}

/**
 * 0 - не выставлена
 * 1 = ожидает исполнения
 * 2 = испольнена
 */
type OrderStatus = 0 | 1 | 2;

@Component({
  selector: 'trade-form',
  standalone: true,
  imports: [
    ListComponent,
    HeaderComponent,
    ItemDirective,
    TuiCheckbox,
    ReactiveFormsModule,
    TuiButton,
    NgTemplateOutlet,
    TuiIcon,
    NgIf,
    AsyncPipe,
    TuiFormatNumberPipe,
    FilterComponent,
    TuiScrollbar,
    DirectionTypePipe,
    OrderTypePipe,
    TuiButtonLoading,
    TuiHint,
    TuiExpand,
    TuiChevron,
    TuiItem,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TradeFormComponent),
      multi: true,
    },
    TradeFormService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeFormComponent implements ControlValueAccessor, AfterViewInit {
  readonly #injector: Injector = inject(Injector);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #dialog: TradeDialogService = inject(TradeDialogService);
  readonly #idea: IdeaFacade = inject(IdeaFacade);
  readonly #store: TradeStore = inject(TradeStore);
  readonly #service: TradeFormService = inject(TradeFormService);

  readonly expanded: WritableSignal<boolean> = signal(false);
  readonly expandedDisabled$: Observable<boolean> = combineLatest([
    this.#store.operations$.pipe(),
    this.#store.orders$.pipe(),
  ]).pipe(
    map(([operations, orders]: [TradeOperations | null, TradeOrders | null]) => !(orders || operations)),
    distinctUntilChanged(),
    startWith(true)
  );

  #onChange = (_: any) => {};
  #onTouched = () => {};

  readonly controlAuto: FormControl<boolean> = new FormControl(true, { nonNullable: true });
  readonly formGroup: FormGroup = new FormGroup({
    entry: new FormArray([]),
    filter: new FormControl(null),
    auto: new FormControl(true, { nonNullable: true }),
    out: new FormArray([]),
  });

  get formArrayEntry(): FormArray {
    return this.formGroup.get('entry') as FormArray;
  }

  get formArrayOut(): FormArray {
    return this.formGroup.get('out') as FormArray;
  }

  get controlFilter(): FormControl {
    return this.formGroup.get('filter') as FormControl;
  }

  readonly itemHeight = 28;

  readonly idea$: Observable<StockPosition> = this.#idea.idea$;
  readonly orders$: Observable<TradeOrders | null> = this.#store.orders$;
  readonly operations$: Observable<TradeOperations | null> = this.#store.operations$;

  listEntry$: Observable<ItemEntry[]> = timer(500).pipe(
    switchMap(() => this.formArrayEntry.valueChanges.pipe(startWith(this.formArrayEntry.value)))
  );

  listOut$: Observable<ItemEntry[]> = timer(500).pipe(
    switchMap(() => this.formArrayOut.valueChanges.pipe(startWith(this.formArrayOut.value)))
  );

  ngAfterViewInit(): void {
    combineLatest([
      this.idea$,
      this.orders$.pipe(filter((orders: TradeOrders | null): orders is TradeOrders => orders !== null)),
      this.operations$.pipe(
        filter((operations: TradeOperations | null): operations is TradeOperations => operations !== null)
      ),
    ])
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(([position, orders, operations]: [StockPosition, TradeOrders, TradeOperations]) => {
        this._updateControls(position, orders, operations);
      });

    this.controlFilter.valueChanges
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.controlFilter.value),
        map((value) => ({
          sourceId: value.source && value.source.id,
          accountId: value.account && value.account.accountId,
          instrumentId: value.instrument && value.instrument.id,
        })),
        filter((value) => value.accountId !== null && value.instrumentId !== null && value.sourceId !== null),
        distinctUntilChanged(this._distinct),
        switchMap((value: any) => timer(0, this.#store.TIMER).pipe(map(() => value)))
      )
      .subscribe((params: Params) => {
        this.#store.loadOrders(params);
        this.#store.loadOperations(params);
      });

    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.formGroup.value))
      .subscribe((value) => this.#onChange(value));
  }

  open(event: Event, list: string, data: any = null) {
    event.preventDefault();

    this.#dialog.openTradeRequest(this.#injector, data).subscribe((value) => {
      // if (value) {
      //   if (list === 'out') {
      //     this.listOut = this.listOut.map((item) => {
      //       if (item.id === data.id) {
      //         return { ...item, price: value.price, amount: value.amount };
      //       }
      //
      //       return item;
      //     });
      //   } else {
      //     this.listEntry = this.listEntry.map((item) => {
      //       if (item.id === data.id) {
      //         return { ...item, price: value.price, amount: value.amount };
      //       }
      //
      //       return item;
      //     });
      //   }
      // }
    });
  }

  remove(event: Event, list: string, data: any): void {
    event.preventDefault();

    // if (list === 'out') {
    //   this.listOut = this.listOut.filter((item) => item.id !== data.id);
    // } else {
    //   this.listEntry = this.listEntry.filter((item) => item.id !== data.id);
    // }
  }

  private _distinct(
    a: { accountId: string; instrumentId: string; sourceId: string },
    b: { accountId: string; instrumentId: string; sourceId: string }
  ): boolean {
    return a.accountId !== b.accountId && a.instrumentId !== b.instrumentId && a.sourceId !== b.sourceId;
  }

  private _updateControls(position: StockPosition, orders: TradeOrders, operations: TradeOperations): void {
    const direction = position.idea.positionType === 'long';
    let entry = [];
    let out = [];
    const operationType = direction ? 15 : 22;

    console.log(position, orders, operations);

    if (position.actions.entries && position.actions.entries.length === 0) {
      entry = position.idea.entries.map((item) => {
        let status: OrderStatus = 0;
        let orderId = null;
        let price = item.price;

        if (orders && orders.length > 0) {
          const order = orders.find((orderItem) => {
            return orderItem.direction === +direction && orderItem.lotsRequested === item.quantity;
          });

          if (order) {
            status = 1;
            orderId = order.orderId;
            price = order.averagePositionPrice.value;
          }
        }

        if (status === 0 && operations && operations.length > 0) {
          const operation = operations.find(
            (operationItem) =>
              operationItem.type === operationType &&
              operationItem.state === 1 &&
              item.quantity === operationItem.quantity
          );

          if (operation) {
            status = 2;

            this._updateIdeaEntries(position, {
              amount: operation.quantity,
              date: operation.date,
              brokerId: 1,
              price: operation.price.value,
            });
          }
        }

        return {
          price,
          quantity: item.quantity,
          total: item.totalPrice,
          direction,
          orderId,
          lot: position.idea.instrument.lot,
          orderType: 1,
          status,
        };
      });
    } else {
      entry = position.actions.entries.map((item) => ({
        ...item,
        price: item.price,
        quantity: item.amount,
        total: item.totalPrice,
        direction,
        lot: position.idea.instrument.lot,
        orderType: 1,
        status: 2,
      }));
    }

    this.formArrayEntry.clear();

    entry.forEach((item, index: number) => {
      this.formArrayEntry.setControl(index, new FormControl(item));
    });

    if (position.actions.outs && position.actions.outs.length > 0) {
      out = position.actions.outs.map((item: StockPositionActionTarget) => ({
        price: item.price,
        quantity: item.amount,
        total: getNumberPrecision(item.price * item.amount, 2),
        direction: !direction,
        lot: position.idea.instrument.lot,
        orderType: 1,
        status: 2,
      }));
    } else {
      out = position.idea.targets.map((item: StockPositionTarget) => ({
        price: item.price,
        quantity: item.amount,
        total: getNumberPrecision(item.price * item.amount, 2),
        lot: position.idea.instrument.lot,
        direction: !direction,
        orderType: 1,
      }));
    }

    this.formArrayOut.clear();

    out.forEach((item, index: number) => {
      this.formArrayOut.setControl(index, new FormControl(item));
    });
  }

  writeValue(obj: any): void {
    this.formGroup.patchValue(obj);
  }

  registerOnChange(fn: any): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formGroup[isDisabled ? 'disable' : 'enable']();
  }

  onRemoveOrder(event: Event, item: TradeOrder & { removed: boolean }): void {
    event.preventDefault();

    item['removed'] = true;

    const { account, source, instrument } = this.controlFilter.value;

    this.#store.removeOrder({
      accountId: account.accountId,
      orderId: item.orderId,
      sourceId: source.id,
      instrumentId: instrument.id,
    });
  }

  onChangeOrder(event: Event, item: TradeOrder & { change: boolean }): void {
    event.preventDefault();

    item['change'] = true;

    const { account, source, instrument } = this.controlFilter.value;

    this.#dialog
      .openTradeRequest(this.#injector, {
        direction: !!item.direction,
        orderType: item.orderType,
        price: item.averagePositionPrice.value,
        log: instrument.lot,
        quantity: item.lotsRequested,
      })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((value: RequestFormValue) => {
        this.#store.changeOrder({
          ...value,
          instrumentId: instrument.id,
          accountId: account.accountId,
          orderId: item.orderId,
          sourceId: source.id,
        });
      });
  }

  private _updateIdeaEntries(
    position: StockPosition,
    order: {
      amount: number;
      date: string;
      brokerId: number;
      price: number;
    }
  ): void {
    this.#idea.editIdea({ id: position.idea.id!, body: this.#service.updateIdeaEntries(position, order) });
  }

  onEditEntry(event: Event, item: ItemEntry & { change: boolean }, index: number): void {
    event.preventDefault();

    item['change'] = true;

    const { account, source, instrument } = this.controlFilter.value;

    this.#dialog
      .openTradeRequest(this.#injector, {
        direction: item.direction,
        orderType: item.orderType,
        price: item.price,
        lot: item.lot,
        quantity: item.quantity,
      })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((value: RequestFormValue | null) => {
        let calcValue: any = { ...item, change: false };

        if (value) {
          calcValue = {
            ...calcValue,
            ...value,
            total: getNumberPrecision(value.price * value.quantity, 2),
          };

          if (item.status === 1) {
            this.#store.changeOrder({
              direction: value.direction,
              orderType: value.orderType,
              price: value.price,
              quantity: value.quantity,
              instrumentId: instrument.id,
              accountId: account.accountId,
              orderId: item.orderId,
              sourceId: source.id,
            });
          }
        }

        this.formArrayEntry.setControl(index, new FormControl(calcValue));
      });
  }

  onRemoveEntry(event: Event, item: ItemEntry & { removed: boolean }, index: number): void {
    event.preventDefault();

    if (item.status === 1) {
      item['removed'] = true;

      const { account, source, instrument } = this.controlFilter.value;

      this.#store.removeOrder({
        accountId: account.accountId,
        orderId: item.orderId,
        sourceId: source.id,
        instrumentId: instrument.id,
      });

      this.formArrayEntry.at(index).disable();
    }
  }

  onExpanded(event: Event): void {
    event.preventDefault();

    this.expanded.update((status: boolean) => !status);
  }
}
