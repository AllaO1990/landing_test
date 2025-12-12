import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { BehaviorSubject, debounceTime, defer, Observable, Subject, Subscriber, switchMap, take, tap } from 'rxjs';
import { AccountBalanceHistory, AccountBalanceHistoryItem } from 'types/account';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { extent } from 'd3-array';
import { scaleLinear, scaleUtc } from 'd3-scale';
import * as d3 from 'd3';
import { curveBumpX } from 'd3';
import { TuiFormatNumberPipe, TuiHint } from '@taiga-ui/core';
import { ChartNumberFormatPipe } from './chart.pipe';

@Component({
  selector: 'portfolio-chart',
  imports: [AsyncPipe, ChartNumberFormatPipe, DatePipe, TuiHint, TuiFormatNumberPipe],
  standalone: true,
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioChartComponent implements OnDestroy {
  @ViewChild('chart', { static: true }) chartElementRef: ElementRef<HTMLElement> | null = null;
  readonly #ngZone: NgZone = inject(NgZone);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly resize$: Observable<ResizeObserverEntry> = defer(() => {
    const elementRef = this.chartElementRef;

    if (elementRef && elementRef.nativeElement) {
      return new Observable((subscriber: Subscriber<ResizeObserverEntry>) => {
        const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => subscriber.next(entries[0]));

        resizeObserver.observe(elementRef.nativeElement);

        return () => {
          resizeObserver.unobserve(elementRef.nativeElement);
          resizeObserver.disconnect();
        };
      }).pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(150));
    }

    return this.#ngZone.onStable.asObservable().pipe(
      take(1),
      switchMap((_) => this.resize$)
    );
  });
  readonly #cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  readonly #data$: Subject<AccountBalanceHistory | null> = new BehaviorSubject<AccountBalanceHistory | null>(null);
  readonly chart$: Observable<any> = this.#data$.asObservable().pipe(
    switchMap((data: AccountBalanceHistory | null) =>
      this.resize$.pipe(
        map((resize: ResizeObserverEntry) => {
          const { width, height } = resize.contentRect;

          return this._createChart(data, width, height);
        })
      )
    ),
    tap((_) => Promise.resolve().then(() => this.#cdr.detectChanges()))
  );

  isEmpty = true;

  @Input() set data(data: AccountBalanceHistory | null) {
    this.#data$.next(data);
  }

  ngOnDestroy(): void {
    this.#data$.complete();
  }

  private _createChart(data: AccountBalanceHistory | null, width = 300, height = 300): any {
    if (data === null) {
      return null;
    }

    if (data.items.length === 0) {
      this.isEmpty = true;

      return null;
    }

    this.isEmpty = false;

    const items = data.items.map((item: AccountBalanceHistoryItem) => ({ ...item, date: new Date(item.date) }));
    const yDomain = extent(items, (d) => d.balance);
    const yMaxAbs = Math.max(Math.abs(yDomain[1] as number), Math.abs(yDomain[0] as number));
    const yMax = Math.max(yDomain[1] as number, yDomain[0] as number);
    const marginTop = 5;
    const marginRight = 5;
    const marginBottom = 30;
    let marginLeft = 30;

    if (yMaxAbs !== undefined) {
      marginLeft += (Math.floor(yMaxAbs).toString().length - 2) * 7;

      if (yMaxAbs !== yMax) {
        marginLeft += 7;
      }
    }

    const x = scaleUtc(extent(items, (d) => d.date) as any, [marginLeft, width - marginRight]);
    const distance =
      (Math.abs(yDomain[1] as number) - Math.abs(yDomain[0] as number)) *
      0.1 *
      ((yDomain[1] as number) + (yDomain[0] as number) > 0 ? 1 : -1);

    const y = scaleLinear([(yDomain[0] as number) - distance, (yDomain[1] as number) + distance] as any, [
      height - marginBottom,
      marginTop,
    ]);
    const area = d3
      .area()
      .x((d: any) => x(d.date))
      .y0(y(Math.min(...items.map((item) => item.balance))))
      .y1((d: any) => y(d.balance))
      .curve(curveBumpX);

    const line = d3
      .line()
      .x((d: any) => x(d.date))
      .y((d: any) => y(d.balance))
      .curve(curveBumpX);

    const yTickCount = height / 50;
    const yTicks = y.ticks(yTickCount > 10 ? 10 : yTickCount);

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
      yTicks: yTicks.map((value: number) => ({
        value,
        offset: y(value),
      })),
      line,
      area,
    };
  }
}
