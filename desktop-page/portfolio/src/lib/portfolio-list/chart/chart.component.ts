import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiAxes, TuiLineChartHint, TuiLineDaysChart } from '@taiga-ui/addon-charts';
import { TUI_MONTHS, tuiFormatNumber, TuiPoint } from '@taiga-ui/core';
import { TuiContext, TuiDay, TuiMonth, TuiStringHandler } from '@taiga-ui/cdk';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { combineLatest, debounceTime, filter, Observable, shareReplay, switchMap } from 'rxjs';
import {
  AccountBalanceHistory,
  AccountBalanceHistoryItem,
  AccountBroker,
  AccountCurrency,
  AccountPortfolio,
  AccountRange,
} from 'types/account';
import { map } from 'rxjs/operators';
import { Params } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { LoaderComponent } from '@ui/components/loader';

interface ChartBalance {
  currencySymbol: string;
  points: [TuiDay, number][];
}

@Component({
  selector: 'lib-portfolio-list-chart',
  standalone: true,
  imports: [TuiAxes, TuiLineChartHint, AsyncPipe, LoaderComponent, NgIf, TuiLineDaysChart],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements AfterViewInit {
  readonly #months$ = inject(TUI_MONTHS);
  readonly #store: PortfolioFacade = inject(PortfolioFacade);

  readonly portfolio$: Observable<AccountPortfolio> = this.#store.portfolio$.pipe(
    filter((list: null | AccountPortfolio): list is AccountPortfolio => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly broker$: Observable<AccountBroker> = this.#store.broker$.pipe(
    filter((list: null | AccountBroker): list is AccountBroker => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly currency$: Observable<AccountCurrency> = this.#store.currency$.pipe(
    filter((list: null | AccountCurrency): list is AccountCurrency => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly range$: Observable<AccountRange> = this.#store.range$.pipe(
    filter((list: null | AccountRange): list is AccountRange => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly balanceHistory$: Observable<null | AccountBalanceHistory> = this.#store.balanceHistory$.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly chart$: Observable<null | ChartBalance> = this.balanceHistory$.pipe(
    map((balance: AccountBalanceHistory | null) => this._getChartBalance(balance)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngAfterViewInit(): void {
    combineLatest([this.broker$, this.currency$, this.range$, this.portfolio$])
      .pipe(
        debounceTime(0),
        map((params: [AccountBroker, AccountCurrency, AccountRange, AccountPortfolio]) => ({
          brokerId: params[0].brokerId,
          currencyId: params[1].currencyId,
          from: params[2].from,
          portfolioId: params[3].portfolioId,
          to: params[2].to,
        }))
        // tap(() => this.#isLoadInfo$.next(true))
      )
      .subscribe((params: Params) => this.#store.loadBalanceHistory(params));
  }

  protected readonly stringify = String;

  readonly xStringify$: Observable<TuiStringHandler<TuiDay>> = this.#months$.pipe(
    map(
      (months) =>
        ({ month, day }) =>
          `${months[month]}, ${day}`
    )
  );

  readonly yStringify$: Observable<TuiStringHandler<number>> = this.chart$.pipe(
    filter((chart: null | ChartBalance): chart is ChartBalance => chart !== null),
    map(
      (chart: ChartBalance) => (y) =>
        `${tuiFormatNumber(y, { precision: 2, decimalMode: 'always' })}${chart.currencySymbol}`
    )
  );

  readonly axisXLabels$: Observable<Array<string | null>> = this.#months$.pipe(
    switchMap((months) =>
      this.chart$.pipe(
        filter((chart: ChartBalance | null): chart is ChartBalance => chart !== null),
        map((chart: ChartBalance) => {
          const from = chart.points[0][0];
          const to = chart.points[chart.points.length - 1][0];

          return [
            ...Array.from(
              { length: TuiMonth.lengthBetween(from, to) + 1 },
              (_, i) => months[from.append({ month: i }).month] ?? ''
            ),
            null,
          ];
        })
      )
    )
  );

  protected readonly hintContent = ({ $implicit }: TuiContext<readonly TuiPoint[]>): number => $implicit[0]?.[1] ?? 0;

  private _getChartBalance(data: null | AccountBalanceHistory): null | ChartBalance {
    if (data === null) {
      return null;
    }

    return {
      currencySymbol: data.currencySymbol,
      points: data.items.map((item: AccountBalanceHistoryItem): [TuiDay, number] => [
        TuiDay.fromLocalNativeDate(new Date(item.date)),
        item.balance,
      ]),
    };
  }
}
