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
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { FilterComponent } from '../filter/filter.component';
import { IdeaFacade } from 'stores/facades/idea.facade';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  pairwise,
  shareReplay,
  startWith,
  switchMap,
  timer,
} from 'rxjs';
import { StockPosition, StockPositionActionEntry, StockPositionActionTarget } from 'types/position';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeStore } from '../common/store';
import { Params } from '@angular/router';
import { DirectionTypePipe } from '../common/direction-type.pipe';
import { OrderTypePipe } from '../common/order-type.pipe';
import { TradeOperation, TradeOperations, TradeOrder, TradeOrders } from '../common/api.types';
import { getNumberPrecision } from 'utils/get-number-precision';
import { RequestFormValue } from '../request/request.component';
import { TradeFormService } from './form.service';
import { TuiItem } from '@taiga-ui/cdk';
import { triggerHeightAnimations } from '@ui/animations/height.animations';
import { ControlValue } from './form.types';

interface ItemEntry {
  direction: boolean;
  instrumentId: string;
  orderType: number | null;
  price: number;
  total: number;
  commission: number;
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
  animations: [triggerHeightAnimations],
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

  isDisabledButton$: Observable<boolean> = this.controlFilter.valueChanges.pipe(
    map((value: null | { token: null | string }): boolean => !(value && value.token)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly itemHeight = 28;

  readonly idea$: Observable<StockPosition> = this.#idea.idea$;
  readonly orders$: Observable<TradeOrders | null> = this.#store.orders$;
  readonly operations$: Observable<TradeOperations | null> = this.#store.operations$;

  readonly listEntry$: Observable<ItemEntry[]> = timer(500).pipe(
    switchMap(() => this.formArrayEntry.valueChanges.pipe(startWith(this.formArrayEntry.value)))
  );

  readonly heightEntry$: Observable<number> = this.listEntry$.pipe(
    map((list: ItemEntry[]) => ((list && list.length) || 0) + 1),
    map((length) => (length > 3 ? 3 * this.itemHeight : length * this.itemHeight))
  );

  readonly listOut$: Observable<ItemEntry[]> = timer(500).pipe(
    switchMap(() => this.formArrayOut.valueChanges.pipe(startWith(this.formArrayOut.value)))
  );

  readonly heightOut$: Observable<number> = this.listOut$.pipe(
    map((list: ItemEntry[]) => ((list && list.length) || 0) + 1),
    map((length) => (length > 4 ? 4 * this.itemHeight : length * this.itemHeight))
  );

  direction = true;

  mapOperationType: any = {
    '22': 'Продажа',
    '19': 'Комиссия',
    '15': 'Покупка',
  };

  mapOperationState: any = {
    2: 'Отмена',
    1: 'Исполнена',
  };

  ngAfterViewInit(): void {
    combineLatest([
      this.idea$,
      this.orders$.pipe(
        filter((orders: TradeOrders | null): orders is TradeOrders => orders !== null),
        distinctUntilChanged((a, b) => a.length === b.length)
      ),
      this.operations$.pipe(
        filter((operations: TradeOperations | null): operations is TradeOperations => operations !== null),
        distinctUntilChanged((a, b) => a.length === b.length)
      ),
    ])
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(100))
      .subscribe(([position, orders, operations]: [StockPosition, TradeOrders, TradeOperations]) => {
        this._initControls(position, orders, operations);
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

    this.controlFilter.valueChanges
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.controlFilter.value),
        map((value: { token: null | string } | null): null | string => value && value.token),
        pairwise()
      )
      .subscribe(([first, second]: [null | string, null | string]) => {
        if (first !== null && second === null) {
          this.formArrayEntry.clear();
          this.formArrayOut.clear();
        }
      });

    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.formGroup.value))
      .subscribe((value) => this.#onChange(value));
  }

  private _distinct(
    a: { accountId: string; instrumentId: string; sourceId: string },
    b: { accountId: string; instrumentId: string; sourceId: string }
  ): boolean {
    return a.accountId !== b.accountId && a.instrumentId !== b.instrumentId && a.sourceId !== b.sourceId;
  }

  // private _updateControls(position: StockPosition, orders: TradeOrders, operations: TradeOperations): void {
  //   this.direction = position.idea.positionType === 'long';
  //   const entry = this._getEntryControlValues(position, orders, operations);
  //   const out = this._getOutControlValues(position, orders, operations);
  //
  //   this.formArrayEntry.clear();
  //
  //   entry.forEach((item, index: number) => {
  //     this.formArrayEntry.setControl(index, new FormControl(item));
  //   });
  //
  //   this.formArrayOut.clear();
  //
  //   if (entry.every((item) => item.status === 0)) {
  //     out.forEach((item, index: number) => {
  //       this.formArrayOut.setControl(index, new FormControl(item));
  //     });
  //   }
  // }

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
        direction: { value: !!item.direction, disabled: true },
        orderType: { value: item.orderType, disabled: true },
        price: { value: item.averagePositionPrice.value, disabled: true },
        log: { value: instrument.lot, disabled: true },
        quantity: { value: item.lotsRequested, disabled: false },
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

  private _updateIdeaEntries(position: StockPosition, entries: TradeOperations, outs: TradeOperations): void {
    this.#idea.editIdea({ id: position.idea.id!, body: this.#service.updateIdea(position, entries, outs) });
  }

  onOpen(event: Event, control: FormArray, direction: boolean, type: 'out' | 'entry' = 'entry') {
    event.preventDefault();

    const { instrument } = this.controlFilter.value;

    let max = null;

    if (this.formArrayEntry.value && this.formArrayEntry.value.length > 0) {
      max = this.formArrayEntry.value.reduce((acc: number, item: { quantity: number }) => {
        return acc + item.quantity;
      }, 0);
    }

    if (type === 'entry') {
      max = null;
    }

    this.#dialog
      .openTradeRequest(this.#injector, {
        direction: { value: direction, disabled: true },
        orderType: { value: null, disabled: false },
        price: { value: null, disabled: false },
        lot: { value: instrument.lot, disabled: false },
        quantity: { value: null, disabled: false },
        max,
      })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((value: RequestFormValue | null) => {
        if (value) {
          const calcValue = {
            ...value,
            status: 0,
            commission: 0,
            lot: instrument.lot,
            lots: Math.floor(value.quantity / instrument.lot),
            total: getNumberPrecision(value.price * value.quantity, 2),
          };
          control.setControl(control.controls.length, new FormControl(calcValue));
        }
      });
  }

  onEdit(event: Event, item: ItemEntry & { change: boolean }, index: number, control: FormArray): void {
    event.preventDefault();

    item['change'] = true;

    const { account, source, instrument } = this.controlFilter.value;

    this.#dialog
      .openTradeRequest(this.#injector, {
        direction: { value: item.direction, disabled: true },
        orderType: { value: item.orderType, disabled: false },
        price: { value: item.price, disabled: false },
        lot: { value: item.lot, disabled: false },
        quantity: { value: item.quantity, disabled: false },
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
              quantity: Math.floor(value.quantity / value.lot),
              instrumentId: instrument.id,
              accountId: account.accountId,
              orderId: item.orderId,
              sourceId: source.id,
            });
          }
        }

        control.setControl(index, new FormControl(calcValue));
      });
  }

  onRemove(event: Event, item: ItemEntry & { removed: boolean }, index: number, control: FormArray): void {
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

      control.at(index).disable();

      return;
    }

    control.removeAt(index);
  }

  onExpanded(event: Event): void {
    event.preventDefault();

    this.expanded.update((status: boolean) => !status);
  }

  addFromIdea(event: Event): void {
    event.preventDefault();

    this.idea$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((position: StockPosition) => {
      const length = this.formArrayOut.value ? this.formArrayOut.value.length : 0;

      this._initOutControl(position, [], []).ideas.forEach((item, index: number) => {
        this.formArrayOut.setControl(index + length, new FormControl(item));
      });
    });
  }

  private _getDifference(first: TradeOrders, second: TradeOrders): TradeOrders {
    const secondIds = second.map((item) => item.orderId);

    return first.filter((firstItem: TradeOrder) => secondIds.includes(firstItem.orderId));
  }

  private _initControls(position: StockPosition, orders: TradeOrders, operations: TradeOperations): void {
    this.direction = position.idea.positionType === 'long';
    const lot = position.idea.instrument.lot;

    const operationsEntry = this._getOperationControlValues(
      position.actions.entries.map((item: StockPositionActionEntry) => Math.floor(item.amount / lot)),
      operations,
      this.direction ? 15 : 22,
      lot
    );

    const operationsOut = this._getOperationControlValues(
      position.actions.outs.map((item: StockPositionActionTarget) => Math.floor(item.amount / lot)),
      operations,
      !this.direction ? 15 : 22,
      lot
    );

    if (operationsEntry.length > 0 || operationsOut.length > 0) {
      this._updateIdeaEntries(position, operationsEntry, operationsOut);

      return;
    }

    const entry: {
      orders: ControlValue[];
      actions: ControlValue[];
      ideas: ControlValue[];
    } = this._initEntryControl(position, orders, operations);
    const out: {
      orders: ControlValue[];
      actions: ControlValue[];
      ideas: ControlValue[];
    } = this._initOutControl(position, orders, operations);

    // if (index === 0) {
    this.formArrayEntry.clear({ emitEvent: false });

    if (
      this.formArrayOut.value &&
      this.formArrayOut.value.findIndex((item: ControlValue) => item.status === 0) === -1
    ) {
      this.formArrayOut.clear({ emitEvent: false });
    }

    [...entry.actions, ...entry.orders, ...entry.ideas].forEach((item, index: number) => {
      this.formArrayEntry.setControl(index, new FormControl(item));
    });

    let outControlValues: ControlValue[] = [...out.actions, ...out.orders];

    if (entry.actions.length === 0) {
      outControlValues = [...outControlValues, ...out.ideas];
    }

    outControlValues.forEach((item, index: number) => {
      this.formArrayOut.setControl(index, new FormControl(item));
    });

    // return;
    // }

    // [...entry.actions, ...entry.orders, ...entry.ideas].forEach((item: ControlValue) => {
    //   const findIndex = (this.formArrayEntry.value as ControlValue[]).findIndex(
    //     (entryItem: ControlValue) => entryItem.lots === item.lots && entryItem.price === item.price
    //   );
    //
    //   if (findIndex !== -1) {
    //     this.formArrayEntry.setControl(index, new FormControl(item));
    //     if (item.lots === 1) {
    //       console.log(findIndex, item, this.formArrayEntry);
    //     }
    //   } else {
    //     this.formArrayEntry.push(new FormControl(item));
    //   }
    // });

    // [...out.actions, ...out.orders, ...out.ideas].forEach((item: ControlValue) => {
    //   const findIndex = (this.formArrayOut.value as ControlValue[]).findIndex(
    //     (entryItem: ControlValue) => entryItem.quantity === item.quantity && entryItem.price === item.price
    //   );
    //
    //   if (findIndex !== -1) {
    //     this.formArrayOut.setControl(findIndex, new FormControl(item));
    //   } else {
    //     this.formArrayOut.push(new FormControl(item));
    //   }
    // });
  }

  _getDefaultControlValue(position: StockPosition, positionType: 'direct' | 'reverse' = 'direct') {
    const direction = position.idea.positionType === 'long';

    return {
      instrumentId: position.idea.instrument.id,
      commission: 0,
      direction: positionType === 'direct' ? direction : !direction,
      orderId: null,
      date: null,
      lot: position.idea.instrument.lot,
    };
  }

  private _initEntryControl(
    position: StockPosition,
    orders: TradeOrders,
    operations: TradeOperations
  ): {
    orders: ControlValue[];
    actions: ControlValue[];
    ideas: ControlValue[];
  } {
    const defaultItem = this._getDefaultControlValue(position);
    const operationType = defaultItem.direction ? 15 : 22;
    const actionQuantity = position.actions.entries.map((item) => Math.floor(item.amount / defaultItem.lot));
    const operationsAction = operations.filter(
      (item: TradeOperation) => item.type === operationType && item.state === 1
    );
    const ordersDirection = orders.filter((item: TradeOrder) => +item.direction === +defaultItem.direction);

    const actionControlValues: ControlValue[] = position.actions.entries.map((item): ControlValue => {
      const lots = Math.floor(item.amount / defaultItem.lot);

      const findOperation =
        operationsAction.find((operation) => Math.floor(operation.quantity / defaultItem.lot) === lots) || null;

      return {
        ...defaultItem,
        price: item.price,
        quantity: item.amount,
        commission: findOperation ? Math.abs(findOperation.comission.value) : 0,
        lots,
        total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
        orderType: null,
        status: 2,
      };
    });

    const ideaControlValues: ControlValue[] = position.idea.entries
      .filter((item) => !actionQuantity.includes(Math.floor(item.quantity / defaultItem.lot)))
      .reduce((acc: ControlValue[], item) => {
        const lots = Math.floor(item.quantity / defaultItem.lot);

        if (ordersDirection.length > 0) {
          const findOrder =
            ordersDirection.find((orderItem: TradeOrder) => {
              return orderItem.lotsRequested === lots;
            }) || null;

          if (findOrder) {
            return acc;
          }
        }

        acc.push({
          ...defaultItem,
          price: item.price,
          commission: 0,
          orderId: null,
          quantity: item.quantity,
          lots,
          total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
          orderType: 1,
          status: 0,
        });

        return acc;
      }, []);

    const orderControlValues: ControlValue[] = ordersDirection.map((item) => ({
      ...defaultItem,
      orderId: item.orderId,
      price: item.averagePositionPrice.value,
      quantity: item.lotsRequested * defaultItem.lot,
      lots: item.lotsRequested,
      orderType: item.orderType,
      commission: item.initialComission.value,
      direction: !!item.direction,
      total: getNumberPrecision(item.averagePositionPrice.value * item.lotsRequested * defaultItem.lot, 2),
      status: 1,
    }));

    return {
      actions: actionControlValues,
      ideas: ideaControlValues,
      orders: orderControlValues,
    };
  }

  private _initOutControl(
    position: StockPosition,
    orders: TradeOrders,
    operations: TradeOperations
  ): {
    orders: ControlValue[];
    operations: ControlValue[];
    actions: ControlValue[];
    ideas: ControlValue[];
  } {
    const defaultItem = this._getDefaultControlValue(position, 'reverse');
    const operationType = defaultItem.direction ? 15 : 22;
    const actionQuantity = position.actions.outs.map((item) => Math.floor(item.amount / defaultItem.lot));
    const operationsAction = operations.filter(
      (item: TradeOperation) => item.type === operationType && item.state === 1
    );
    const ordersDirection = orders.filter((item: TradeOrder) => +item.direction === +defaultItem.direction);

    const actionControlValues: ControlValue[] = position.actions.outs.map((item): ControlValue => {
      const lots = Math.floor(item.amount / defaultItem.lot);

      const findOperation =
        operationsAction.find((operation) => Math.floor(operation.quantity / defaultItem.lot) === lots) || null;

      return {
        ...defaultItem,
        price: item.price,
        lots,
        commission: findOperation ? Math.abs(findOperation.comission.value) : 0,
        quantity: item.amount,
        total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
        orderType: null,
        status: 2,
      };
    });

    const ideaControlValues: ControlValue[] = position.idea.targets
      .filter((item) => !actionQuantity.includes(item.amount))
      .reduce((acc: ControlValue[], item) => {
        const lots = Math.floor(item.amount / defaultItem.lot);

        if (ordersDirection.length > 0) {
          const findOrder =
            ordersDirection.find((orderItem: TradeOrder) => {
              return orderItem.lotsRequested === lots;
            }) || null;

          if (findOrder) {
            return acc;
          }
        }

        acc.push({
          ...defaultItem,
          price: item.price,
          commission: 0,
          orderId: null,
          lots,
          quantity: item.amount,
          total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
          orderType: 1,
          status: 0,
        });

        return acc;
      }, []);

    const orderControlValues: ControlValue[] = orders
      .filter((item) => +item.direction === +defaultItem.direction)
      .map((item) => ({
        ...defaultItem,
        orderId: item.orderId,
        price: item.averagePositionPrice.value,
        quantity: item.lotsRequested * defaultItem.lot,
        lots: item.lotsRequested,
        commission: item.initialComission.value,
        orderType: item.orderType,
        direction: !!item.direction,
        total: getNumberPrecision(item.averagePositionPrice.value * item.lotsRequested * defaultItem.lot, 2),
        status: 1,
      }));

    const operationControlValues: ControlValue[] = operations
      .filter((item) => item.type === operationType && item.state === 1)
      .filter((item) => actionControlValues.findIndex((action) => action.quantity === item.quantity) === -1)
      .map((item) => {
        return {
          ...defaultItem,
          price: item.price.value,
          quantity: item.quantity * defaultItem.lot,
          lots: item.quantity,
          commission: item.comission.value,
          date: item.date,
          total: getNumberPrecision(item.price.value * item.quantity, 2),
          orderType: null,
          status: 2,
        };
      });

    return {
      actions: actionControlValues,
      ideas: ideaControlValues,
      orders: orderControlValues,
      operations: operationControlValues,
    };
  }

  private _getOperationControlValues(
    list: number[],
    operations: TradeOperations,
    operationType: 15 | 22,
    lot: number
  ): TradeOperations {
    const tempLots = list.slice();

    return operations
      .filter((item) => item.type === operationType && item.state === 1)
      .filter(
        (item) =>
          tempLots.findIndex((lots: number, index: number) => {
            if (lots === Math.floor(item.quantity / lot)) {
              tempLots.splice(index, 1);
              return true;
            }

            return false;
          }) === -1
      );
  }
}
