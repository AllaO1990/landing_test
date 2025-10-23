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
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
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
  skip,
  startWith,
  switchMap,
  timer,
} from 'rxjs';
import { StockPosition, StockPositionActionEntry, StockPositionActionTarget } from 'types/position';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeStore } from '../common/store';
import { DirectionTypePipe } from '../common/direction-type.pipe';
import { OrderTypePipe } from '../common/order-type.pipe';
import { TradeOperations, TradeOrder, TradeOrders, TradeStopOrder, TradeStopOrders } from '../common/api.types';
import { getNumberPrecision } from 'utils/get-number-precision';
import { RequestFormValue } from '../request/request.component';
import { TradeFormService } from './form.service';
import { TuiItem } from '@taiga-ui/cdk';
import { triggerHeightAnimations } from '@ui/animations/height.animations';
import { ControlValue, ControlValueStatus } from './form.types';
import { DetailsComponent } from '../details/details.component';
import { getPriceIncrement } from 'utils/get-price-increment';
import { Params } from '@angular/router';
import { TradeStopOrderTypeText } from '../common/order.types';

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
    DetailsComponent,
    DatePipe,
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
    stop: new FormArray([]),
  });

  get formArrayEntry(): FormArray {
    return this.formGroup.get('entry') as FormArray;
  }

  get formArrayOut(): FormArray {
    return this.formGroup.get('out') as FormArray;
  }

  get formArrayStop(): FormArray {
    return this.formGroup.get('stop') as FormArray;
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
  readonly orders$: Observable<TradeOrders | null> = this.#store.orders$.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly stopOrders$: Observable<TradeStopOrders | null> = this.#store.stopOrders$;
  readonly operations$: Observable<TradeOperations | null> = this.#store.operations$;

  readonly listEntry$: Observable<ControlValue[]> = timer(500).pipe(
    switchMap(() => this.formArrayEntry.valueChanges.pipe(startWith(this.formArrayEntry.value))),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly heightEntry$: Observable<number> = this.listEntry$.pipe(
    map((list: ControlValue[]) => ((list && list.length) || 0) + 1),
    map((length) => (length > 3 ? 3 * this.itemHeight : length * this.itemHeight))
  );

  readonly listOut$: Observable<ControlValue[]> = timer(500).pipe(
    switchMap(() => this.formArrayOut.valueChanges.pipe(startWith(this.formArrayOut.value))),
    debounceTime(0),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly heightOut$: Observable<number> = this.listOut$.pipe(
    map((list: ControlValue[]) => ((list && list.length) || 0) + 1),
    map((length) => (length > 4 ? 4 * this.itemHeight : length * this.itemHeight)),
    distinctUntilChanged()
  );

  readonly listStop$: Observable<ControlValue[]> = timer(500).pipe(
    switchMap(() => this.formArrayStop.valueChanges.pipe(startWith(this.formArrayStop.value))),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly heightStop$: Observable<number> = this.listStop$.pipe(
    map((list: ControlValue[]) => ((list && list.length) || 0) + 1),
    map((length) => (length > 4 ? 4 * this.itemHeight : length * this.itemHeight)),
    distinctUntilChanged()
  );

  direction = true;

  mapOperationType: { [key: string]: string } = {
    '22': 'Продажа',
    '19': 'Комиссия',
    '15': 'Покупка',
  };

  mapOperationState: { [key: string]: string } = {
    2: 'Отмена',
    1: 'Исполнена',
  };

  ngAfterViewInit(): void {
    combineLatest([
      this.idea$,
      this.orders$.pipe(
        filter((orders: TradeOrders | null): orders is TradeOrders => orders !== null),
        distinctUntilChanged((a, b) => this._distinctOrders(a, b))
      ),
      this.stopOrders$.pipe(
        filter((orders: TradeStopOrders | null): orders is TradeStopOrders => orders !== null),
        distinctUntilChanged((a, b) => this._distinctStopOrders(a, b))
      ),
      this.operations$.pipe(
        filter((operations: TradeOperations | null): operations is TradeOperations => operations !== null),
        distinctUntilChanged((a, b) => a.length === b.length)
      ),
    ])
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(100))
      .subscribe(
        ([position, orders, stopOrders, operations]: [
          StockPosition,
          TradeOrders,
          TradeStopOrders,
          TradeOperations
        ]) => {
          // console.log('_initControls', position, orders, stopOrders, operations);
          this._initControls(position, orders, stopOrders, operations);
        }
      );

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
        switchMap((value: Params) =>
          timer(0, this.#store.TIMER).pipe(
            takeUntilDestroyed(this.#destroyRef),
            map(() => value)
          )
        )
      )
      .subscribe((params: Params) => {
        this.#store.loadOrders(params);
        this.#store.loadOperations(params);
      });

    combineLatest([
      this.listEntry$.pipe(
        takeUntilDestroyed(this.#destroyRef),
        filter((list: ControlValue[]) => list.length === 1),
        map((value: ControlValue[]) => value[0].lots),
        distinctUntilChanged(),
        skip(1)
      ),
      this.idea$,
    ]).subscribe(([entryLots, position]) => {
      const priceIncrement = getPriceIncrement(position.idea.instrument.minPriceIncrement);
      const outs = this.#service.getOutControlValue(position, [], [], [], this.controlFilter.value).ideas;
      const data = this.#service.getCalcOutIdea(outs, entryLots, priceIncrement);

      this.formArrayOut.clear({ emitEvent: false });
      data.forEach((value: ControlValue, index: number) => {
        this.formArrayOut.setControl(index, new FormControl(value));
      });

      const stopControlValue: ControlValue | null = this.formArrayStop.value[0] || null;

      if (stopControlValue) {
        this.formArrayStop.setControl(
          0,
          new FormControl({
            ...stopControlValue,
            quantity: entryLots * stopControlValue.lot,
            lots: entryLots,
            total: getNumberPrecision(
              (stopControlValue.stopPrice || stopControlValue.price) * entryLots * stopControlValue.lot,
              2
            ),
          })
        );
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
    return a.accountId === b.accountId && a.instrumentId === b.instrumentId && a.sourceId === b.sourceId;
  }

  trackBy(index: number, item: ControlValue): ControlValue {
    return item;
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

  onRemove(event: Event, item: any): void {
    if (this.#store.isOrder(item.orderTypeText)) {
      this.onRemoveOrder(event, { ...item, id: item.orderId });
    }

    if (this.#store.isStopOrder(item.orderTypeText)) {
      this.onRemoveStopOrder(event, { ...item, id: item.stopOrderId });
    }
  }

  onRemoveOrder(event: Event, item: { id: string | null; removed: boolean }): void {
    event.preventDefault();
    const { account, source, instrument } = this.controlFilter.value;

    item['removed'] = true;

    this.#store.removeOrder({
      accountId: account.accountId,
      id: item.id,
      sourceId: source.id,
      instrumentId: instrument.id,
    });
  }

  onRemoveStopOrder(event: Event, item: { id: string | null; removed: boolean }): void {
    event.preventDefault();

    item['removed'] = true;

    const { account, source, instrument } = this.controlFilter.value;

    this.#store.removeStopOrder({
      accountId: account.accountId,
      id: item.id,
      sourceId: source.id,
      instrumentId: instrument.id,
    });
  }

  private _updateIdeaEntries(
    position: StockPosition,
    entries: TradeOperations,
    outs: TradeOperations,
    commissions: TradeOperations
  ): void {
    const id = position.idea.id;

    if (id) {
      this.#idea.editIdea({
        id,
        body: this.#service.updateIdea(position, entries, outs, commissions),
      });
    }
  }

  onOpen(event: Event, control: FormArray, direction: boolean, type: 'out' | 'entry' | 'stop' = 'entry') {
    event.preventDefault();

    const { instrument, lastPrice } = this.controlFilter.value;

    const minPriceIncrement = getNumberPrecision(instrument.minPriceIncrement * 3, 2);
    let max = null;

    if (type === 'out' && this.formArrayEntry.value && this.formArrayEntry.value.length > 0) {
      max = this.formArrayEntry.value.reduce((acc: number, item: { lots: number }) => {
        return acc + item.lots;
      }, 0);
    }

    this.#dialog
      .openTradeRequest(this.#injector, {
        data: {
          direction: { value: direction, disabled: true },
          orderType: { value: null, disabled: false },
          price: { value: null, disabled: false },
          lot: { value: instrument.lot, disabled: false },
          minPriceIncrement: { value: minPriceIncrement, disabled: false },
          quantity: { value: null, disabled: false },
          lastPrice: { value: lastPrice.last, disabled: true },
          max,
        },
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

  onEdit(event: Event, item: ControlValue, index: number, control: FormArray): void {
    event.preventDefault();

    item['change'] = true;

    const { account, source, instrument, lastPrice } = this.controlFilter.value;
    const minPriceIncrement = getNumberPrecision(instrument.minPriceIncrement * 3, 2);

    this.#dialog
      .openTradeRequest(this.#injector, {
        data: {
          ...this._getDataForRequestForm(item),
          lastPrice: { value: lastPrice.last, disabled: true },
          minPriceIncrement: { value: minPriceIncrement, disabled: false },
        },
      })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((value: RequestFormValue | null) => {
        let calcValue: Partial<ControlValue> = { ...item, change: false };

        if (value) {
          calcValue = {
            ...calcValue,
            ...value,
            change: item.status === ControlValueStatus.AWAITS,
            total: getNumberPrecision(value.price * value.lots * item.lot, 2),
          };

          if (item.status === ControlValueStatus.AWAITS && item.orderType) {
            if (this.#store.isOrder(item.orderType.type)) {
              this.#store.changeOrder({
                ...calcValue,
                quantity: calcValue.lots,
                instrumentId: instrument.id,
                accountId: account.accountId,
                sourceId: source.id,
              });
            }

            if (this.#store.isStopOrder(item.orderType.type)) {
              this.#store.changeStopOrder({
                ...calcValue,
                quantity: calcValue.lots,
                instrumentId: instrument.id,
                accountId: account.accountId,
                sourceId: source.id,
              });
            }
          }
        }

        control.setControl(index, new FormControl(calcValue));
      });
  }

  onRemoveWithControl(event: Event, item: ControlValue, index: number, control: FormArray): void {
    event.preventDefault();

    if (item.orderType && item.orderType.type === TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS) {
      this.#idea.idea$
        .pipe(
          takeUntilDestroyed(this.#destroyRef)
          // take(1)
        )
        .subscribe((position: StockPosition) => {
          let stop = position.idea.stop;

          if (stop) {
            stop = {
              ...stop,
              price: 0,
            };
          }

          const updatePosition: StockPosition = {
            ...position,
            idea: {
              ...position.idea,
              stop,
            },
          };

          this.#idea.editIdea({
            id: position.idea.id!,
            body: this.#service.updateIdea(updatePosition, [], [], []),
          });
        });
    }

    if (item.status === ControlValueStatus.AWAITS) {
      if (item.orderType) {
        if (this.#store.isOrder(item.orderType.type)) {
          this.onRemoveOrder(event, item);
        }

        if (this.#store.isStopOrder(item.orderType.type)) {
          this.onRemoveStopOrder(event, item);
        }
      }

      control.at(index).disable();
      return;
    }

    control.removeAt(index, { emitEvent: true });
  }

  onExpanded(event: Event): void {
    event.preventDefault();

    this.expanded.update((status: boolean) => !status);
  }

  addFromIdea(event: Event): void {
    event.preventDefault();

    this.idea$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        distinctUntilChanged((a, b) => a.idea.id === b.idea.id)
      )
      .subscribe((position: StockPosition) => {
        const length = this.formArrayOut.value ? this.formArrayOut.value.length : 0;

        this.#service
          .getOutControlValue(position, [], [], [], this.controlFilter.value)
          .ideas.forEach((item, index: number) => {
            this.formArrayOut.setControl(index + length, new FormControl(item));
          });
      });
  }

  private _initControls(
    position: StockPosition,
    orders: TradeOrders,
    stopOrders: TradeStopOrders,
    operations: TradeOperations
  ): void {
    this.direction = position.idea.positionType === 'long';
    const lot = position.idea.instrument.lot;
    const { source } = this.controlFilter.value;

    const operationTypeEntry = this.#service.getOperationType(this.direction);
    const operationTypeOut = this.#service.getOperationType(!this.direction);
    const actualOperations = this.#service.getActualOperations(position, operations);

    const operationsEntryPosition = this.#service.getFilteredOperations(
      position.actions.entries
        .filter((item: StockPositionActionEntry) => item.brokerId === source.id)
        .map((item: StockPositionActionEntry) => Math.floor(item.amount / lot)),
      actualOperations,
      operationTypeEntry
    );

    const operationsOutPosition = this.#service.getFilteredOperations(
      position.actions.outs
        .filter((item: StockPositionActionTarget) => item.brokerId === source.id)
        .map((item: StockPositionActionTarget) => Math.floor(item.amount / lot)),
      actualOperations,
      operationTypeOut
    );

    const commissions = [...operationsEntryPosition, ...operationsOutPosition]
      .filter((item) => item.comission.value !== 0)
      .filter((item) => {
        return (
          position.comissions.findIndex(
            (commission) =>
              commission.date === item.date && Math.abs(commission.size) === Math.abs(item.comission.value)
          ) === -1
        );
      });

    if (operationsEntryPosition.length > 0 || operationsOutPosition.length > 0 || commissions.length > 0) {
      this._updateIdeaEntries(position, operationsEntryPosition, operationsOutPosition, commissions);

      return;
    }

    const entry: {
      orders: ControlValue[];
      actions: ControlValue[];
      ideas: ControlValue[];
    } = this.#service.getEntryControlValue(
      position,
      orders,
      stopOrders,
      actualOperations.filter((item) => item.type === operationTypeEntry),
      this.controlFilter.value
    );

    const out: {
      orders: ControlValue[];
      actions: ControlValue[];
      ideas: ControlValue[];
    } = this.#service.getOutControlValue(
      position,
      orders,
      stopOrders,
      actualOperations.filter((item) => item.type === operationTypeOut),
      this.controlFilter.value
    );

    const tempEntry: ControlValue[] = this.formArrayEntry
      ? this.formArrayEntry.value.filter((item: ControlValue) => item.status === ControlValueStatus.UNLOADING)
      : [];
    const tempOut: ControlValue[] = this.formArrayOut.value
      ? this.formArrayOut.value.filter((item: ControlValue) => item.status === ControlValueStatus.UNLOADING)
      : [];
    const tempStop: ControlValue[] = this.formArrayStop.value
      ? this.formArrayStop.value.filter((item: ControlValue) => item.status === ControlValueStatus.UNLOADING)
      : [];

    this.formArrayEntry.clear({ emitEvent: false });
    this.formArrayOut.clear({ emitEvent: false });
    this.formArrayStop.clear({ emitEvent: false });

    this._setControl(this.formArrayEntry, tempEntry, entry, this.direction);

    const compose = this.formArrayEntry.value.filter(
      (item: ControlValue) => item.status !== ControlValueStatus.UNLOADING
    );

    this._setControl(this.formArrayOut, tempOut, out, !this.direction, compose.length === 0);

    const stopLoss = this.#service.getStopLossControlValue(
      position,
      tempStop,
      orders,
      stopOrders,
      actualOperations.filter((item) => item.type === operationTypeOut)
    );

    if (stopLoss) {
      this.formArrayStop.setControl(0, new FormControl(stopLoss), { emitEvent: true });
    }

    this.formArrayEntry.patchValue([]);
    this.formArrayOut.patchValue([]);
  }

  private _getDataForRequestForm(item: ControlValue) {
    return {
      direction: { value: item.direction, disabled: true },
      expirationType: { value: item.expirationType, disabled: false },
      expireDate: { value: item.expireDate, disabled: false },
      orderType: { value: item.orderType, disabled: false },
      price: { value: item.price, disabled: false },
      lot: { value: item.lot, disabled: false },
      stopPrice: { value: item.stopPrice, disabled: false },
      trailingData: { value: item.trailingData, disabled: false },
      quantity: { value: item.quantity, disabled: false },
    };
  }

  private _distinctOrders(a: TradeOrders, b: TradeOrders): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((item: TradeOrder, index: number) => {
      return (
        item.lotsRequested === b[index].lotsRequested &&
        item.orderType === b[index].orderType &&
        item.averagePositionPrice.value === b[index].averagePositionPrice.value
      );
    });
  }

  private _distinctStopOrders(a: TradeStopOrders, b: TradeStopOrders): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((item: TradeStopOrder, index: number) => {
      return (
        item.lotsRequested === b[index].lotsRequested &&
        item.orderType === b[index].orderType &&
        item.stopPrice.value === b[index].stopPrice.value
      );
    });
  }

  private _setControl(
    formArray: FormArray,
    tempControlValues: ControlValue[],
    controlValues: {
      orders: ControlValue[];
      actions: ControlValue[];
      ideas: ControlValue[];
    },
    direction: boolean,
    compose = true
  ): void {
    if (tempControlValues.length === 0) {
      let concatControlValues = [...controlValues.orders, ...controlValues.actions];

      if (compose) {
        concatControlValues = [...concatControlValues, ...controlValues.ideas];
      }

      const sortFn = (direction: boolean) =>
        direction
          ? (a: ControlValue, b: ControlValue) => b.price - a.price
          : (a: ControlValue, b: ControlValue) => a.price - b.price;

      concatControlValues.sort(sortFn(direction)).forEach((item: ControlValue, index: number) => {
        formArray.setControl(index, new FormControl(item), { emitEvent: false });
      });
    }

    if (tempControlValues.length > 0) {
      const concatControlValues = [...controlValues.actions, ...controlValues.orders];
      const copyControlValues: (ControlValue | null)[] = concatControlValues.map((item) => ({ ...item }));

      tempControlValues.forEach((item: ControlValue, index: number) => {
        const findIndex = concatControlValues.findIndex((control: ControlValue) => control.lots === item.lots);

        let control = item;

        if (findIndex !== -1) {
          control = {
            ...control,
            change: false,
            id: concatControlValues[findIndex].id,
            status: concatControlValues[findIndex].status,
          };
          copyControlValues[findIndex] = null;
          concatControlValues[findIndex].lot = -1;
        }

        formArray.setControl(index, new FormControl(control), { emitEvent: false });
      });

      if (tempControlValues.length !== copyControlValues.length) {
        copyControlValues.forEach((item: ControlValue | null, index: number) => {
          if (item !== null) {
            formArray.setControl(index, new FormControl(item), { emitEvent: false });
          }
        });
      }
    }
  }
}
