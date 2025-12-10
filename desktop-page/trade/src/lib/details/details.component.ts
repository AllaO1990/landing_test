import { ChangeDetectionStrategy, Component, inject, Input, OnDestroy } from '@angular/core';
import { StockInstrument, WithLastPrice } from 'types/stock';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, shareReplay, Subject } from 'rxjs';
import { TradeAccount, TradePortfolio, TradeSource, TradeToken } from '../common/api.types';
import { InstrumentComponent } from 'ui-common/lib/instrument/instrument.component';
import { AsyncPipe } from '@angular/common';
import { TuiCell } from '@taiga-ui/layout';
import { TuiFormatNumberPipe, TuiTitle } from '@taiga-ui/core';
import { getNumberPrecision } from 'utils/get-number-precision';
import { TradeStore } from '../common/store';
import { TuiCurrencyPipe } from '@taiga-ui/addon-commerce';
import { LoaderComponent } from '@ui/components/loader';
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
  imports: [InstrumentComponent, AsyncPipe, TuiCell, TuiTitle, TuiFormatNumberPipe, TuiCurrencyPipe, LoaderComponent],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsComponent implements OnDestroy {
  readonly #store: TradeStore = inject(TradeStore);
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
}
