import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TuiButton } from '@taiga-ui/core';
import { TuiButtonLoading, TuiSkeleton } from '@taiga-ui/kit';
import { TRADE_ORDER_TYPE_MARKET } from '../common/order.constants';
import { getNumberPrecision } from 'utils/get-number-precision';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  take,
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
import { TradeStore } from '../common/store';
import { StockInstrument, WithLastPrice } from 'types/stock';
import { Response } from 'types/response';

interface DetailsData {
  instrument: StockInstrument | null;
  source: TradeSource | null;
  token: TradeToken | null;
  account: TradeAccount | null;
  lastPrice: WithLastPrice | null;
}

interface TradePortfolioData {
  quantity: number;
  price: number;
}

@Component({
  selector: 'trade-close-position',
  standalone: true,
  imports: [AsyncPipe, TuiButton, TuiButtonLoading, TuiSkeleton],
  templateUrl: './close-position.component.html',
  styleUrl: './close-position.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosePositionComponent implements OnDestroy {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #store: TradeStore = inject(TradeStore);
  readonly #detailsData$: Subject<DetailsData | null> = new BehaviorSubject<DetailsData | null>(null);

  loading = false;

  @Input()
  set data(value: DetailsData | null) {
    this.#detailsData$.next(value);
  }

  readonly closeButton$: Observable<any | null> = combineLatest([
    this.#detailsData$
      .asObservable()
      .pipe(
        filter(
          (data: DetailsData | null) =>
            data !== null && data.source !== null && data.instrument !== null && data.account !== null
        )
      ),
    this.#store.portfolio$.pipe(
      map((portfolio: Response<TradePortfolio> | null) => this._calcTradePortfolio(portfolio))
    ),
  ]).pipe(
    map(([details, portfolio]: [DetailsData | null, TradePortfolioData | null]) => {
      if (details === null) {
        return null;
      }

      if (portfolio === null) {
        return null;
      }

      this.loading = false;

      return { ...details, ...portfolio };
    }),
    startWith(null)
  );

  onClosePosition(event: Event, close: DetailsData & TradePortfolioData): void {
    event.preventDefault();

    this.loading = true;

    const { source, instrument, account } = close;

    if (source && instrument && account) {
      this.#store.addOrder({
        direction: !(close.quantity > 0),
        orderType: TRADE_ORDER_TYPE_MARKET,
        price: close.price,
        quantity: getNumberPrecision(Math.abs(close.quantity) / instrument.lot, 0),
        accountId: account.accountId,
        instrumentId: instrument.id,
        sourceId: source.id,
      });

      this.#store.orders$
        .pipe(
          takeUntilDestroyed(this.#destroyRef),
          take(1),
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
          take(1),
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

  private _calcTradePortfolio(portfolio: Response<TradePortfolio> | null): TradePortfolioData | null {
    if (portfolio === null) {
      return null;
    }

    if (portfolio.data === null) {
      return {
        quantity: 0,
        price: 0,
      };
    }

    const position = portfolio.data.positions[0];

    if (!position) {
      return {
        quantity: 0,
        price: 0,
      };
    }

    return {
      quantity: position.quantity,
      price: position.averagePositionPrice.value,
    };
  }

  ngOnDestroy(): void {
    this.#detailsData$.complete();
  }
}
