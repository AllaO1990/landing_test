import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  ViewChild,
} from '@angular/core';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import {
  combineLatest,
  debounceTime,
  defer,
  filter,
  finalize,
  Observable,
  shareReplay,
  Subscriber,
  switchMap,
  take,
} from 'rxjs';
import {
  AccountBalanceHistory,
  AccountBalanceHistoryItem,
  AccountBroker,
  AccountCurrency,
  AccountPortfolio,
  AccountRange,
  AccountStrategy,
} from 'types/account';
import { map } from 'rxjs/operators';
import { Params } from '@angular/router';
import { LoaderComponent } from '@ui/components/loader';
import * as d3 from 'd3';
import { extent } from 'd3-array';
import { scaleLinear, scaleUtc } from 'd3-scale';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { TuiFormatNumberPipe, TuiHint } from '@taiga-ui/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartNumberFormatPipe } from './chart.pipe';

@Component({
  selector: 'lib-portfolio-list-chart',
  standalone: true,
  imports: [LoaderComponent, NgIf, AsyncPipe, NgForOf, DatePipe, TuiFormatNumberPipe, TuiHint, ChartNumberFormatPipe],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  providers: [TuiFormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements AfterViewInit {
  readonly #store: PortfolioFacade = inject(PortfolioFacade);
  readonly #ngZone: NgZone = inject(NgZone);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

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
  readonly strategy$: Observable<AccountStrategy> = this.#store.strategy$.pipe(
    filter((list: null | AccountStrategy): list is AccountStrategy => list !== null),
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
    map((data: AccountBalanceHistory | null) => this._createChart(data))

    // switchMap((data: AccountBalanceHistory | null) =>
    //   this.resize$.pipe(
    //     map((resizeEntry: ResizeObserverEntry) => {
    //       if (data === null) {
    //         return null;
    //       }
    //
    //       const {
    //         contentRect: { width, height },
    //       } = resizeEntry;
    //
    //       const items = data.items.map((item: AccountBalanceHistoryItem) => ({ ...item, date: new Date(item.date) }));
    //       const yDomain = extent(items, (d) => d.balance);
    //       const yMax = Math.max(Math.abs(yDomain[1] as number), Math.abs(yDomain[0] as number));
    //       // const width = 300;
    //       // const height = 300;
    //       const marginTop = 20;
    //       const marginRight = 30;
    //       const marginBottom = 30;
    //       const marginLeft = 40 + (yMax !== undefined ? (Math.floor(yMax).toString().length - 2) * 7 : 0);
    //       const x = scaleUtc(extent(items, (d) => d.date) as any, [marginLeft, width - marginRight]);
    //       const distance =
    //         (Math.abs(yDomain[1] as number) - Math.abs(yDomain[0] as number)) *
    //         0.1 *
    //         ((yDomain[1] as number) + (yDomain[0] as number) > 0 ? 1 : -1);
    //
    //       const y = scaleLinear([(yDomain[0] as number) - distance, (yDomain[1] as number) + distance] as any, [
    //         height - marginBottom,
    //         marginTop,
    //       ]);
    //       const line = d3
    //         .line()
    //         .x((d: any) => x(d.date))
    //         .y((d: any) => y(d.balance));
    //
    //       return {
    //         items,
    //         currencySymbol: data.currencySymbol,
    //         width,
    //         height,
    //         marginTop,
    //         marginRight,
    //         marginBottom,
    //         marginLeft,
    //         x,
    //         xTicksLine: ['M', x.range()[0], 0, 'L', x.range()[1], 0].join(' '),
    //         xTicks: x.ticks(width / 80).map((value: Date) => ({
    //           value,
    //           offset: x(value),
    //         })),
    //         y,
    //         yTicksLine: x.range()[1] - marginLeft,
    //         yTicks: y.ticks(height / 40).map((value: number) => ({
    //           value,
    //           offset: y(value),
    //         })),
    //         line,
    //       };
    //     })
    //   )
    // )
  );

  @ViewChild('chart', { static: true }) chartElementRef: ElementRef<HTMLElement> | null = null;

  resize$: Observable<ResizeObserverEntry> = defer(() => {
    const elementRef = this.chartElementRef;

    if (elementRef && elementRef.nativeElement) {
      return new Observable((subscriber: Subscriber<ResizeObserverEntry>) => {
        const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => subscriber.next(entries[0]));

        resizeObserver.observe(elementRef.nativeElement);

        return () => {
          resizeObserver.unobserve(elementRef.nativeElement);
          resizeObserver.disconnect();
        };
      }).pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(50));
    }

    return this.#ngZone.onStable.asObservable().pipe(
      take(1),
      switchMap((_) => this.resize$)
    );
  });

  ngAfterViewInit(): void {
    combineLatest([this.broker$, this.currency$, this.range$, this.portfolio$, this.strategy$])
      .pipe(
        debounceTime(0),
        map((params: [AccountBroker, AccountCurrency, AccountRange, AccountPortfolio, AccountStrategy]) => ({
          brokerId: params[0].brokerId,
          currencyId: params[1].currencyId,
          from: params[2].from,
          portfolioId: params[3].portfolioId,
          to: params[2].to,
          strategyId: params[4].id,
        }))
        // tap(() => this.#isLoadInfo$.next(true))
      )
      .subscribe((params: Params) => this.#store.loadBalanceHistory(params));

    this.resize$.pipe(finalize(() => console.log('resize complete'))).subscribe((res) => console.log(res));
  }

  private _createChart(data: AccountBalanceHistory | null, width = 300, height = 300): any {
    if (data === null) {
      return null;
    }

    const items = data.items.map((item: AccountBalanceHistoryItem) => ({ ...item, date: new Date(item.date) }));
    const yDomain = extent(items, (d) => d.balance);
    const yMax = Math.max(Math.abs(yDomain[1] as number), Math.abs(yDomain[0] as number));
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40 + (yMax !== undefined ? (Math.floor(yMax).toString().length - 2) * 7 : 0);
    const x = scaleUtc(extent(items, (d) => d.date) as any, [marginLeft, width - marginRight]);
    const distance =
      (Math.abs(yDomain[1] as number) - Math.abs(yDomain[0] as number)) *
      0.1 *
      ((yDomain[1] as number) + (yDomain[0] as number) > 0 ? 1 : -1);

    const y = scaleLinear([(yDomain[0] as number) - distance, (yDomain[1] as number) + distance] as any, [
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
  }
}
