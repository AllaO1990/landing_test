import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { TradeFormComponent } from '../form/form.component';
import { TuiButton } from '@taiga-ui/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../common/api.service';
import { TradeStore } from '../common/store';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  pairwise,
  startWith,
  Subject,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValue, ControlValueStatus } from '../form/form.types';
import { TradeStopOrder, TradeStopOrders } from '../common/api.types';
import { TradeStopOrderTypeText } from '../common/order.types';
import { TuiButtonLoading } from '@taiga-ui/kit';

@Component({
  selector: 'trade-layout',
  standalone: true,
  imports: [TradeFormComponent, TuiButton, ReactiveFormsModule, AsyncPipe, TuiButtonLoading],
  templateUrl: './layout.component.html',
  styleUrls: ['../common/dialog.scss', './layout.component.scss'],
  providers: [
    ApiService,
    {
      provide: TradeStore,
      useFactory: (api: ApiService) => new TradeStore(api),
      deps: [ApiService],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit, OnDestroy {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #store: TradeStore = inject(TradeStore);
  readonly #isSubmitted$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  readonly #isLoadingButton$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  loading = false;

  readonly formGroup: FormGroup = new FormGroup({
    trade: new FormControl(null),
  });

  readonly isUnloading$: Observable<boolean> = this.formGroup.valueChanges.pipe(
    startWith(this.formGroup.value),
    map((value) => value.trade),
    filter((value) => value !== null),
    map((value) => ({ entry: value.entry, out: value.out, stop: value.stop })),
    map(
      ({
        entry,
        out,
        stop,
      }: {
        entry: { status: ControlValueStatus }[];
        out: { status: ControlValueStatus }[];
        stop: { status: ControlValueStatus }[];
      }) => {
        if (!entry || !out || !stop) {
          return true;
        }
        if (entry.length === 0 && out.length === 0 && stop.length === 0) {
          return true;
        }

        const entryIndex = entry.findIndex((item) => item.status === ControlValueStatus.UNLOADING);
        const outIndex = out.findIndex((item) => item.status === ControlValueStatus.UNLOADING);
        const stopIndex = stop.findIndex((item) => item.status === ControlValueStatus.UNLOADING);

        return entryIndex === -1 && outIndex === -1 && stopIndex === -1;
      }
    ),
    distinctUntilChanged(),
    tap((flag) => {
      if (flag) {
        this.loading = false;
      }
      console.log('isUnloading$', flag);
    })
  );

  readonly isDisabled$: Observable<boolean> = combineLatest([this.isUnloading$]).pipe(
    map(([isUnloading]: [boolean]) => isUnloading),
    distinctUntilChanged()
  );

  #isStop$: Observable<ControlValue> = this.formGroup.valueChanges.pipe(
    takeUntilDestroyed(this.#destroyRef),
    map((value: { trade: { entry: ControlValue[]; stop: ControlValue[] } }) => ({
      entry: value.trade.entry,
      stop: value.trade.stop,
    })),
    filter(
      ({ entry, stop }: { entry: ControlValue[]; stop: ControlValue[] }) =>
        entry && entry.length > 0 && stop && stop.length > 0
    ),
    filter(
      ({ entry }: { entry: ControlValue[]; stop: ControlValue[] }) => entry[0].status === ControlValueStatus.EXECUTED
    ),
    map(({ entry, stop }: { entry: ControlValue[]; stop: ControlValue[] }) => ({ entry: entry[0], stop: stop[0] })),
    distinctUntilChanged((a, b) => this._distinct(a, b)),
    map(({ stop }: { stop: ControlValue }) => stop)
  );

  ngAfterViewInit(): void {
    this.#store.loadOrderTypes();

    this.#isSubmitted$
      .asObservable()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        filter((isSubmitted: boolean) => isSubmitted),
        switchMap(() =>
          this.formGroup.valueChanges.pipe(
            switchMap((value) => timer(100).pipe(map(() => value))),
            startWith(this.formGroup.value),
            map((value: { trade: { entry: ControlValue[] } }): ControlValue[] => value.trade.entry),
            pairwise(),
            // tap(([first, second]: [ControlValue[], ControlValue[]]) =>
            //   console.log(first, first[0] && first[0].status, second[0] && second[0].status)
            // ),
            filter(
              ([first, second]: [ControlValue[], ControlValue[]]) =>
                (!first || !first[0] || (first[0] && first[0].status !== ControlValueStatus.EXECUTED)) &&
                second &&
                second[0] &&
                second[0].status === ControlValueStatus.EXECUTED
            ),
            // tap(([first, second]: [ControlValue[], ControlValue[]]) =>
            //   console.log('after filter', first[0] && first[0].status, second, second[0] && second[0].status)
            // ),
            map((data: [ControlValue[], ControlValue[]]) => data[1])
          )
        )
        // take(1)
      )
      .subscribe(() => {
        const {
          filter: { account, instrument, source },
          out,
          stop,
        } = this.formGroup.value.trade;

        if (account && instrument && source) {
          const outOrders = this._getOrders(
            [
              ...out,
              //, ...stop
            ].filter((item: { status: ControlValueStatus }) => item.status === ControlValueStatus.UNLOADING),
            account.accountId,
            instrument.id,
            source.id
          );

          if (outOrders.length > 0) {
            this.#store.addOrders(outOrders);
          }
        }
      });

    this.#isStop$
      .pipe(
        switchMap((value: ControlValue) =>
          this.#store.stopOrders$.pipe(
            filter((list: TradeStopOrders | null): list is TradeStopOrders => list !== null),
            map((list: TradeStopOrders) =>
              list.filter(
                (item: TradeStopOrder) => item.orderTypeText === TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS
              )
            ),
            filter(
              (list: TradeStopOrders) =>
                list.length > 0 && list.findIndex((item: TradeStopOrder) => item.lotsRequested !== value.lots) !== -1
            )
          )
        )
      )
      .subscribe((orders: TradeStopOrders) => {
        console.log('this.#isStop$ removeStopOrder');
        const {
          filter: { account, instrument, source },
        } = this.formGroup.value.trade;

        this.#store.removeStopOrder({
          accountId: account.accountId,
          id: orders[0].stopOrderId,
          sourceId: source.id,
          instrumentId: instrument.id,
        });
      });

    this.#isStop$
      .pipe(filter((value: ControlValue) => value.status === ControlValueStatus.UNLOADING))
      .subscribe((controlValue: ControlValue) => {
        console.log('this.#isStop$ addStopOrder');
        const {
          filter: { account, instrument, source },
        } = this.formGroup.value.trade;

        this.#store.addStopOrder(this._getOrder(controlValue, account.accountId, instrument.id, source.id));
      });

    // this.#isSubmitted$
    //   .asObservable()
    //   .pipe(
    //     takeUntilDestroyed(this.#destroyRef),
    //     filter((isSubmitted: boolean) => isSubmitted),
    //     switchMap(() =>
    //       this.#isStop$.pipe(filter((value: ControlValue) => value.status === ControlValueStatus.UNLOADING))
    //     )
    //   )
    //   .subscribe((controlValue: ControlValue) => {
    //     const {
    //       filter: { account, instrument, source },
    //     } = this.formGroup.value.trade;
    //
    //     console.log(controlValue);
    //
    //     this.#store.addStopOrder(this._getOrder(controlValue, account.accountId, instrument.id, source.id));
    //   });

    // this.#store.stopOrders$
    //   .pipe(
    //     filter((list: TradeStopOrders | null): list is TradeStopOrders => list !== null),
    //     filter((list: TradeStopOrders) => list.length > 0),
    //     map((list) => list[1])
    //     // switchMap((list) =>
    //     //   timer(2000).pipe(
    //     //     takeWhile((orders) => orders !== list.length),
    //     //     tap((data) => console.log(data)),
    //     //     tap((index) => {
    //     //
    //     //     })
    //     //   )
    //     // )
    //   )
    //   .subscribe((order: TradeStopOrder) => {
    //     console.log(order);
    //     const {
    //       filter: { account, instrument, source },
    //     } = this.formGroup.value.trade;
    //
    //     this.#store.removeStopOrder({
    //       accountId: account.accountId,
    //       id: order.stopOrderId,
    //       sourceId: source.id,
    //       instrumentId: instrument.id,
    //     });
    //   });
  }

  ngOnDestroy(): void {
    this.#isSubmitted$.complete();
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.loading) {
      return;
    }

    this.loading = true;

    console.log('onSubmit loading', this.loading);

    this.#isSubmitted$.next(true);
    const { filter, entry, out, stop } = this.formGroup.getRawValue().trade;
    const { account, instrument, source } = filter;

    const entryOrders = this._getOrders(
      entry.filter((item: { status: ControlValueStatus }) => item.status === ControlValueStatus.UNLOADING),
      account.accountId,
      instrument.id,
      source.id
    );

    if (entryOrders.length > 0) {
      this.#store.addOrders(entryOrders);

      return;
    }

    const outOrders = this._getOrders(
      out.filter((item: { status: ControlValueStatus }) => item.status === ControlValueStatus.UNLOADING),
      account.accountId,
      instrument.id,
      source.id
    );

    const stopOrders = this._getOrders(
      stop.filter((item: { status: ControlValueStatus }) => item.status === ControlValueStatus.UNLOADING),
      account.accountId,
      instrument.id,
      source.id
    );

    const common = [...outOrders, ...stopOrders];

    if (common.length > 0) {
      this.#store.addOrders(common);
    }
  }

  private _getOrder(controlValue: ControlValue, accountId: string, instrumentId: string, sourceId: number): any {
    const { total, quantity, lots, lot, ...order } = controlValue;

    return {
      ...order,
      quantity: lots,
      // quantity: getNumberPrecision(quantity / lot, 0),
      lot,
      accountId,
      instrumentId,
      sourceId,
    };
  }

  private _getOrders(orders: any[], accountId: string, instrumentId: string, sourceId: number): any[] {
    return orders.map((item: ControlValue) => this._getOrder(item, accountId, instrumentId, sourceId));
  }

  private _distinct(
    a: { entry: ControlValue; stop: ControlValue },
    b: {
      entry: ControlValue;
      stop: ControlValue;
    }
  ): boolean {
    if (!this._distinctControlValue(a.entry, b.entry)) {
      return false;
    }

    return this._distinctControlValue(a.stop, b.stop);
  }

  private _distinctControlValue(a: ControlValue, b: ControlValue): boolean {
    return (
      a.status === b.status &&
      a.price === b.price &&
      a.stopPrice === b.stopPrice &&
      a.lots === b.lots &&
      a.expirationType?.id === b.expirationType?.id &&
      a.orderType?.id === b.orderType?.id
    );
  }
}
