import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnDestroy } from '@angular/core';
import { StockInstrument, WithLastPrice } from 'types/stock';
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
} from 'rxjs';
import {
  TradeAccount,
  TradeOrder,
  TradeOrders,
  TradePortfolio,
  TradeSource,
  TradeStopOrder,
  TradeStopOrders,
  TradeToken,
} from '../common/api.types';
import { InstrumentComponent } from 'ui-common/lib/instrument/instrument.component';
import { AsyncPipe } from '@angular/common';
import { TuiCell } from '@taiga-ui/layout';
import { TuiButton, TuiFormatNumberPipe, TuiTitle } from '@taiga-ui/core';
import { getNumberPrecision } from 'utils/get-number-precision';
import { TradeStore } from '../common/store';
import { TuiCurrencyPipe } from '@taiga-ui/addon-commerce';
import { LoaderComponent } from '@ui/components/loader';
import { TuiButtonLoading } from '@taiga-ui/kit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TRADE_ORDER_TYPE_MARKET } from '../common/order.constants';
import { Response } from 'types/response';

interface DetailsData {
  instrument: StockInstrument | null;
  source: TradeSource | null;
  token: TradeToken | null;
  account: TradeAccount | null;
  lastPrice: WithLastPrice | null;
}

interface DetailsClose {
  instrument: StockInstrument;
  source: TradeSource;
  account: TradeAccount;
}

interface DetailsPosition {
  loading: boolean;
  quantity: number;
  currency: string;
  price: number;
  total: number;
}

@Component({
  selector: 'trade-details',
  standalone: true,
  imports: [
    InstrumentComponent,
    AsyncPipe,
    TuiCell,
    TuiTitle,
    TuiFormatNumberPipe,
    TuiCurrencyPipe,
    LoaderComponent,
    TuiButton,
    TuiButtonLoading,
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsComponent implements OnDestroy {
  readonly #store: TradeStore = inject(TradeStore);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #data$: Subject<DetailsData | null> = new BehaviorSubject<DetailsData | null>(null);
  readonly size = 's';

  readonly data$: Observable<DetailsData> = this.#data$.asObservable().pipe(
    filter((data: DetailsData | null): data is DetailsData => data !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly instrument$: Observable<StockInstrument | null> = this.data$.pipe(
    map((data: DetailsData) => data.instrument),
    distinctUntilChanged()
  );
  readonly lastPrice$: Observable<WithLastPrice | null> = this.data$.pipe(
    map((data: DetailsData) => data.lastPrice),
    distinctUntilChanged()
  );
  readonly close$: Observable<DetailsClose> = this.data$.pipe(
    map((data: DetailsData) => ({
      instrument: data.instrument,
      account: data.account,
      source: data.source,
    })),
    filter((data): data is DetailsClose => data.instrument !== null && data.account !== null && data.source !== null),
    distinctUntilChanged()
  );
  readonly portfolio$: Observable<{ data: DetailsPosition | null } | null> = this.#store.portfolio$.pipe(
    map((portfolio: Response<TradePortfolio> | null) => {
      if (portfolio === null) {
        return null;
      }

      if (portfolio.data === null) {
        return { data: null };
      }

      const position = portfolio.data.positions[0];

      if (!position) {
        return {
          data: {
            loading: false,
            quantity: 0,
            total: 0,
            price: 0,
            currency: 'RUB',
          },
        };
      }

      return {
        data: {
          loading: false,
          quantity: position.quantity,
          total: getNumberPrecision(position.quantity * position.averagePositionPrice.value, 2),
          price: position.averagePositionPrice.value,
          currency: position.currentPrice.currency.toUpperCase(),
        },
      };
    })
  );

  @Input()
  set data(value: DetailsData | null) {
    this.#data$.next(value);
  }

  ngOnDestroy(): void {
    this.#data$.complete();
  }

  onClosePosition(event: Event, position: DetailsPosition, close: DetailsClose): void {
    event.preventDefault();

    position.loading = true;

    const { source, instrument, account } = close;

    this.#store.addOrder({
      direction: !(position.quantity > 0),
      orderType: TRADE_ORDER_TYPE_MARKET,
      price: position.price,
      quantity: getNumberPrecision(Math.abs(position.quantity) / instrument.lot, 0),
      accountId: account.accountId,
      instrumentId: instrument.id,
      sourceId: source.id,
    });

    this.#store.orders$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        switchMap((orders: TradeOrders | null) => {
          if (orders === null) {
            return of(orders);
          }

          return forkJoin([
            orders.map((item: TradeOrder) =>
              this.#store.removeOrder({
                accountId: account.accountId,
                id: item.orderId,
                sourceId: source.id,
                instrumentId: instrument.id,
              })
            ),
          ]);
        })
      )
      .subscribe();

    this.#store.stopOrders$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        switchMap((orders: TradeStopOrders | null) => {
          if (orders === null) {
            return of(orders);
          }

          return forkJoin([
            orders.map((item: TradeStopOrder) =>
              this.#store.removeStopOrder({
                accountId: account.accountId,
                id: item.stopOrderId,
                sourceId: source.id,
                instrumentId: instrument.id,
              })
            ),
          ]);
        })
      )
      .subscribe();
  }
}
