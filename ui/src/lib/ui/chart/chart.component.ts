import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnDestroy,
} from '@angular/core';

import * as Highcharts from 'highcharts/highstock';
import HC_exporting from 'highcharts/modules/exporting';

import { HighchartsChartModule } from 'highcharts-angular';
import HIndicatorsAll from 'highcharts/indicators/indicators-all';
import HAnnotationsAdvanced from 'highcharts/modules/annotations-advanced';
import HDragPanes from 'highcharts/modules/drag-panes';
import HDraggablePoints from 'highcharts/modules/draggable-points';
import HFullScreen from 'highcharts/modules/full-screen';
import HPriceIndicator from 'highcharts/modules/price-indicator';
import HStockTools from 'highcharts/modules/stock-tools';
import { NgIf } from '@angular/common';
import { HIGHCHARTS_LANG, HIGHCHARTS_OPTIONS } from './chart.options';
import { BehaviorSubject, filter, map, shareReplay, Subject, switchMap } from 'rxjs';
import { WheelSetExtremes } from './chart.utils';
import { tuiFormatNumber } from '@taiga-ui/core';

HC_exporting(Highcharts);

HIndicatorsAll(Highcharts);
HDragPanes(Highcharts);
HDraggablePoints(Highcharts);
HAnnotationsAdvanced(Highcharts);
HPriceIndicator(Highcharts);
HFullScreen(Highcharts);
HStockTools(Highcharts);

interface Candle {
  close: number;
  high: number;
  isComplete: boolean;
  low: number;
  open: number;
  time: string;
  volume: number;
}

@Component({
  selector: 'vt-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  standalone: true,
  imports: [HighchartsChartModule, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private _instrument$: Subject<any> = new BehaviorSubject(null);
  private _chart$: Subject<Highcharts.Chart | null> = new BehaviorSubject<Highcharts.Chart | null>(null);

  increment = 5;

  private _chartOptions: Highcharts.Options = {
    chart: {
      panning: {
        enabled: true,
        type: 'xy',
      },
      events: {
        load: function () {
          const chart: Highcharts.Chart = this;
          const yAxis: any = chart.yAxis[0];
          const xAxis: any = chart.xAxis[0];
          let startAxisMove = false;
          let startChartMove = false;

          if (!yAxis['axisRect']) {
            yAxis['axisRect'] = chart.renderer
              .rect()
              .attr({
                fill: 'transparent',
              })
              .css({
                cursor: 'ns-resize',
              })
              .add(yAxis.labelGroup);
          }

          WheelSetExtremes(chart, 'yAxis', 0.1);

          Promise.resolve().then(() => {
            const dateUTC = new Date(xAxis.max).setUTCHours(12, 0, 0, 0);
            const min = new Date(dateUTC).setMonth(new Date().getMonth() - 4).valueOf();
            const max = new Date(dateUTC).setMonth(new Date().getMonth() + 1).valueOf();

            xAxis.setExtremes(min, max, true);
          });

          yAxis['axisRect'].on('wheel', (event: WheelEvent) => {
            WheelSetExtremes(chart, 'yAxis', 0.0001 * event.deltaY);
          });

          (chart as any)['chartBackground'].on('mousedown', () => {
            startChartMove = true;
          });

          yAxis['axisRect'].on('mousedown', () => {
            startAxisMove = true;
          });

          document.addEventListener('mousemove', (event: MouseEvent) => {
            event.stopPropagation();

            if (startAxisMove && event.movementY !== 0) {
              WheelSetExtremes(chart, 'yAxis', 0.001 * event.movementY);
            }

            if (startChartMove && event.movementY !== 0) {
              const { min, max } = yAxis.getExtremes();
              const step = event.movementY * yAxis.toValue(1) * 0.001;

              yAxis.setExtremes(min + step, max + step, true, false);
            }
          });

          document.addEventListener('mouseup', () => {
            startChartMove = startAxisMove = false;
          });
        },
        render: function () {
          const chart: Highcharts.Chart = this;

          const yAxis: any = chart.yAxis[0];

          if (yAxis.tickPositions && yAxis.tickPositions.length) {
            const width = Math.max(
              ...yAxis.tickPositions.map((item: number) => yAxis.ticks[item].label.getBBox().width)
            );

            yAxis['axisRect'].attr({
              width: width + 30,
              height: yAxis.height,
              x: yAxis.width + yAxis.left,
              y: yAxis.top,
            });
          }
        },
      },
      zooming: {
        pinchType: 'x',
      },
    },
    xAxis: {
      startOnTick: false,
      endOnTick: false,
      crosshair: {
        snap: false,
        dashStyle: 'LongDash',
        label: {
          enabled: true,
          format: '{value:%d %b}',
        },
      },
    },
    yAxis: {
      startOnTick: false,
      endOnTick: false,
      offset: 30,
      crosshair: {
        snap: false,
        dashStyle: 'LongDash',
        label: {
          enabled: true,
          formatter: (value: number) => tuiFormatNumber(value, { precision: this.increment }),
        },
      },
    },
  };

  protected readonly Highcharts: typeof Highcharts = Highcharts;

  candlesEmpty = false;

  chartOptions: Highcharts.Options = Object.assign({}, HIGHCHARTS_OPTIONS, this._chartOptions);

  @Input()
  set data(instrument: any | null) {
    console.log('set data', instrument);

    this.candlesEmpty = instrument.candles === null;

    // (this.chartOptions.yAxis as any).crosshair.label.format = '{value:.6f}';

    // (this.chartOptions.yAxis as Highcharts.YAxisOptions).crosshair = {
    //   label: {
    //     format: '{value:.6f}',
    //   },
    // };
    // (this.chartOptions.xAxis as Highcharts.XAxisOptions).max =
    //   instrument.candles[instrument.candles.length - 1].x + 24 * 60 * 60 * 1000 * 30;
    // (this.chartOptions.xAxis as any).dataMax =
    //   instrument.candles[instrument.candles.length - 1].x + 24 * 60 * 60 * 1000 * 30;

    if (instrument.candles !== null) {
      this._instrument$.next(instrument);
    }
  }

  constructor() {
    Highcharts.setOptions({
      lang: HIGHCHARTS_LANG,
    });
  }

  onMouseWheel(event: WheelEvent): void {
    // console.log(event);
  }

  onTouchMove(event: TouchEvent | MouseEvent): void {
    console.log(event);
  }

  onInstance(chart: Highcharts.Chart): void {
    this._chart$.next(chart);
  }

  ngAfterViewInit(): void {
    const chart$ = this._chart$.asObservable().pipe(
      filter((chart: Highcharts.Chart | null): chart is Highcharts.Chart => chart !== null),
      shareReplay(1)
    );

    chart$
      .pipe(
        switchMap((chart: Highcharts.Chart) =>
          this._instrument$.asObservable().pipe(
            filter((instrument: any | null): instrument is any => instrument !== null),
            map((instrument) => ({ chart, instrument }))
          )
        )
      )
      .subscribe(({ chart, instrument }: { chart: Highcharts.Chart; instrument: any }) => {
        const candlestick = chart.series[0];

        if (candlestick) {
          this.increment = instrument.increment;

          candlestick.name = instrument.name;
          candlestick.setData(instrument.candles, true, false, false);

          chart.yAxis[0].setExtremes();
        }
      });
  }

  private _setExtremesX(chart: Highcharts.Chart): void {
    const xAxis = chart.xAxis[0];

    if (xAxis.max) {
      const date = new Date(xAxis.max);
      const start = new Date().setFullYear(date.getFullYear(), date.getMonth() - 5, date.getDate()).valueOf();
      const end = new Date().setFullYear(date.getFullYear(), date.getMonth() + 1, date.getDate()).valueOf();

      xAxis.setExtremes(start, end, true, false);
    }
  }

  ngOnDestroy(): void {
    this._chart$.complete();
    this._instrument$.complete();
  }
}
