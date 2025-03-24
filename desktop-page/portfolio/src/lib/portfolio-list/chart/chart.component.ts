import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  ViewChild,
} from '@angular/core';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { combineLatest, debounceTime, defer, filter, Observable, of, shareReplay, switchMap, take } from 'rxjs';
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
  readonly #zone: NgZone = inject(NgZone);

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

  readonly width = 300;
  readonly height = 300;
  readonly marginTop = 20;
  readonly marginRight = 30;
  readonly marginBottom = 30;
  readonly marginLeft = 40;

  @ViewChild('chart', { static: true }) _chartElementRef: ElementRef | null = null;

  chartElementRef$: Observable<ElementRef> = defer(() => {
    if (this._chartElementRef && this._chartElementRef.nativeElement) {
      return of(this._chartElementRef);
    }

    return this.#zone.onStable.asObservable().pipe(
      take(1),
      switchMap(() => this.chartElementRef$)
    );
  });

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

    this.chartElementRef$
      .pipe(
        switchMap((elementRef: ElementRef) =>
          this.chart$.pipe(map((data: AccountBalanceHistory | null) => ({ char: elementRef, data })))
        )
      )
      .subscribe((result) => {
        const width = 300;
        const height = 300;
        const marginTop = 20;
        const marginRight = 30;
        const marginBottom = 30;
        const marginLeft = 40;

        const data = result.data;
        //
        // if (data) {
        //   const xRange: any = extent(data.items, (d: AccountBalanceHistoryItem) => new Date(d.date));
        //   const x = d3.scaleUtc([xRange[0], xRange[1]], [marginLeft, width - marginRight]);
        //
        //   const yRange = extent(data.items, (d: AccountBalanceHistoryItem) => d.balance);
        //   const y = d3.scaleLinear([(yRange[0] as number) * 0.9, (yRange[1] as number) * 1.1] as any, [
        //     height - marginBottom,
        //     marginTop,
        //   ]);
        //   const line = d3
        //     .line()
        //     .x((d) => x(new Date((d as any).date)))
        //     .y((d) => y((d as any).balance));
        //
        //   console.log(x.range());
        //
        //   const svg = d3
        //     .select(result.char.nativeElement)
        //     .append('svg')
        //     .attr('viewBox', [0, 0, width, height])
        //     .attr('preserveAspectRatio', 'xMinYMin meet')
        //     .attr('style', 'max-width: 100%; height: auto; height: intrinsic;');
        //
        //   svg
        //     .append('g')
        //     .attr('transform', `translate(0,${height - marginBottom})`)
        //     .call(
        //       d3
        //         .axisBottom(x)
        //         .ticks(width / 80)
        //         .tickSizeOuter(0)
        //     );
        //
        //   svg
        //     .append('g')
        //     .attr('transform', `translate(${marginLeft},0)`)
        //     .call(d3.axisLeft(y).ticks(height / 40))
        //     .call((g) => g.select('.domain').remove())
        //     .call((g) =>
        //       g
        //         .selectAll('.tick line')
        //         .clone()
        //         .attr('x2', width - marginLeft - marginRight)
        //         .attr('stroke-opacity', 0.1)
        //     );
        //
        //   svg
        //     .append('path')
        //     .attr('fill', 'none')
        //     .attr('stroke', 'steelblue')
        //     .attr('stroke-width', 1.5)
        //     .attr('d', line(data.items as any));
        //
        //   svg
        //     .append('g')
        //     .selectAll('circle')
        //     .data(data.items)
        //     .enter()
        //     .append('circle')
        //     .attr('r', 3)
        //     .attr('cx', (d) => x(new Date(d.date)))
        //     .attr('cy', (d) => y(d.balance))
        //     .attr('stroke', 'steelblue')
        //     .attr('fill', 'white');
        // }
      });
  }
}
