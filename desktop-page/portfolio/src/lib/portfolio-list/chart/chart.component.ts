import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { combineLatest, debounceTime, filter, Observable, shareReplay } from 'rxjs';
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
import { LoaderComponent } from '@ui/components/loader';
import * as d3 from 'd3';
import { extent } from 'd3-array';
import { scaleLinear, scaleUtc } from 'd3-scale';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { TuiFormatNumberPipe } from '@taiga-ui/core';

@Component({
  selector: 'lib-portfolio-list-chart',
  standalone: true,
  imports: [LoaderComponent, NgIf, AsyncPipe, NgForOf, DatePipe, TuiFormatNumberPipe],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements AfterViewInit {
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

  readonly data$: Observable<AccountBalanceHistory | null> = this.balanceHistory$.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly chart$: Observable<any> = this.data$.pipe(
    map((data: AccountBalanceHistory | null) => {
      if (data === null) {
        return null;
      }

      const items = data.items.map((item: AccountBalanceHistoryItem) => ({ ...item, date: new Date(item.date) }));
      const yDomain = extent(items, (d) => d.balance);
      const yMax = yDomain[1];
      const width = 300;
      const height = 300;
      const marginTop = 20;
      const marginRight = 30;
      const marginBottom = 30;
      const marginLeft = 40 + (yMax !== undefined ? (Math.floor(yMax).toString().length - 2) * 4 : 0);
      const x = scaleUtc(extent(items, (d) => d.date) as any, [marginLeft, width - marginRight]);
      const y = scaleLinear([(yDomain[0] as number) * 0.9, (yDomain[1] as number) * 1.1] as any, [
        height - marginBottom,
        marginTop,
      ]);
      const line = d3
        .line()
        .x((d: any) => x(d.date))
        .y((d: any) => y(d.balance));

      return {
        items,
        currencySymbol: data.currencySymbol,
        width,
        height,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        x,
        xTicksLine: ['M', x.range()[0], 0, 'L', x.range()[1], 0].join(' '),
        xTicks: x.ticks(width / 80).map((value: Date) => ({
          value,
          offset: x(value),
        })),
        y,
        yTicksLine: x.range()[1] - marginLeft,
        yTicks: y.ticks(height / 40).map((value: number) => ({
          value,
          offset: y(value),
        })),
        line,
      };
    })
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
}
