import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';

import * as Highcharts from 'highcharts/highstock';

import HC_exporting from 'highcharts/modules/exporting';

import { HighchartsChartComponent, HighchartsChartModule } from 'highcharts-angular';
import HIndicatorsAll from 'highcharts/indicators/indicators-all';
import HAnnotationsAdvanced from 'highcharts/modules/annotations-advanced';
import HDragPanes from 'highcharts/modules/drag-panes';
import HDraggablePoints from 'highcharts/modules/draggable-points';
import HFullScreen from 'highcharts/modules/full-screen';
import HPriceIndicator from 'highcharts/modules/price-indicator';
import HStockTools from 'highcharts/modules/stock-tools';
import { StockInstrument } from 'types/stock';
import { ColorIndicator } from 'types/color';
import {
  defer,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  ReplaySubject,
  shareReplay,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import { SeriesSplineOptions } from 'highcharts';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CHART_INDICATORS_NAME } from './chart.constants';

HC_exporting(Highcharts);

HIndicatorsAll(Highcharts);
HDragPanes(Highcharts);
HDraggablePoints(Highcharts);
HAnnotationsAdvanced(Highcharts);
HPriceIndicator(Highcharts);
HFullScreen(Highcharts);
HStockTools(Highcharts);

@Component({
  selector: 'vt-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  standalone: true,
  imports: [HighchartsChartModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _ngZone: NgZone = inject(NgZone);

  private readonly _indicatorsName: string[] = CHART_INDICATORS_NAME;

  private readonly _indicators$: Subject<Highcharts.SeriesSplineOptions[] | null> = new ReplaySubject(1);
  private readonly _candlestick$: Subject<Highcharts.SeriesCandlestickOptions> = new ReplaySubject(1);
  private readonly _text$: Subject<string | number | null> = new ReplaySubject(1);

  private _text: Highcharts.SVGElement | null = null;
  private _textSvgWidth = 0;

  #zoomMode: 'x' | 'y' | 'xy' = 'xy';
  #prevXExtremes: [number | undefined, number | undefined] = [undefined, undefined];
  #zoomDirectionOut = 1;
  #zoomFromStartShare = {
    x: 0.5,
    y: 0.5,
  };
  #startPanZoomY = -1;
  consolidationZonesIsExist = false;

  chartOptions: Highcharts.Options = {
    boost: { useGPUTranslations: true, usePreallocated: true },
    navigator: { enabled: false },
    credits: { enabled: false },
    legend: {
      enabled: false,
    },
    xAxis: {
      ordinal: false,
      maxPadding: 0.5,
      endOnTick: true,
    },
    yAxis: {
      endOnTick: false,
      startOnTick: false,
      crosshair: {
        snap: false,
        label: {
          backgroundColor: '#33333388',
          enabled: true,
          formatter: (value: number) => {
            return value.toFixed(5);
          },
        },
      },
    },
    scrollbar: {
      margin: 0,
    },
    chart: {
      animation: false,
      zooming: {
        mouseWheel: { type: 'x' },
        resetButton: { position: { x: -60 } },
      },
      panning: { enabled: true, type: 'xy' },
      // marginBottom: 30,
      events: {
        render: (event: any) => {
          if (this._text) {
            const { e, f } = new DOMMatrix(this._text.getStyle('transform'));
            const { plotWidth, plotHeight, plotTop, plotLeft } = event.target;
            const x = plotWidth + plotLeft - this._textSvgWidth - 35;
            const y = plotHeight + plotTop - 25;

            if (x !== e || y !== f) {
              this._text.translate(x, y);
            }
          }
        },
      },
    },
    rangeSelector: {
      inputEnabled: false,
      allButtonsEnabled: true,
      buttons: [
        {
          type: 'year',
          count: 2,
          text: 'День',
          preserveDataGrouping: true,
          dataGrouping: {
            forced: true,
            units: [['day', [1]]],
          },
        },
        {
          type: 'year',
          count: 2,
          text: 'Неделя',
          preserveDataGrouping: true,
          dataGrouping: {
            forced: true,
            units: [['week', [1]]],
          },
        },
        {
          type: 'all',
          text: 'Месяц',
          preserveDataGrouping: true,
          dataGrouping: {
            forced: true,
            units: [['month', [1]]],
          },
        },
      ],
      buttonTheme: {
        width: 60,
      },
      selected: 0,
    },
    tooltip: {
      shape: 'rect',
      headerShape: 'callout',
      borderWidth: 0,
      // split: true,
      backgroundColor: 'rgba(0,0,0,0)',
      shadow: false,
      positioner: function (width, height, point) {
        const chart = this.chart;
        let position;

        if (point.isHeader) {
          position = {
            x: Math.max(
              // Left side limit
              0,
              Math.min(
                point.plotX + chart.plotLeft - width / 2,
                // Right side limit
                //@ts-expect-error sdfs
                chart.chartWidth - width - chart.marginRight
              )
            ),
            y: point.plotY,
          };
        } else {
          position = {
            x: point.series.chart.plotLeft,
            //@ts-expect-error sdfs
            y: point.series.yAxis.top - chart.plotTop,
          };
        }

        return position;
      },
    },
    stockTools: {
      gui: {
        visible: false,
      },
    },
    plotOptions: {
      candlestick: {
        color: '#ff0043',
        lineColor: '#ff0043',
        upColor: '#00a281',
        upLineColor: '#00a281',
        allowPointSelect: true,
        dataGrouping: {
          forced: true,
          enabled: true,
          units: [
            ['day', [1]],
            ['week', [1]],
            ['month', [6]],
            ['year', null],
          ],
        },
      },
      spline: {
        dataGrouping: {
          groupAll: true,
          groupPixelWidth: 10,
        },
        allowPointSelect: false,
        marker: { enabled: false },
        label: { enabled: false },
        lastPrice: { enabled: false },
        lastVisiblePrice: {
          enabled: false,
        },
        showInLegend: false,
        showInNavigator: false,
        tooltip: {
          followPointer: false,
          followTouchMove: false,
        },
      },
      series: {
        point: {
          events: {
            click: (event) => {
              // Do nothing
            },
            mouseOver: () => {
              // Do nothing
            },
          },
        },
      },
    },
    series: [
      {
        type: 'candlestick',
        name: '',
        data: [],
        id: 'primary',
        showInLegend: false,
        opacity: 1,
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b> {series.name} </b>' +
            'Open: {point.open} ' +
            'High: {point.high} ' +
            'Low: {point.low} ' +
            'Close: {point.close}',
        },
      },
      {
        id: 'ema10',
        type: 'spline',
        name: 'EMA 10',
        color: ColorIndicator.EMA10,
        lineWidth: 1,
        showInLegend: false,
      },
      {
        id: 'ema20',
        type: 'spline',
        name: 'EMA 20',
        color: ColorIndicator.EMA20,
        lineWidth: 1,
        showInLegend: false,
      },
      {
        id: 'ema30',
        type: 'spline',
        name: 'EMA 30',
        color: ColorIndicator.EMA30,
        lineWidth: 1,
        showInLegend: false,
      },
      {
        id: 'ema50',
        type: 'spline',
        name: 'EMA 50',
        color: ColorIndicator.EMA50,
        lineWidth: 1,
        showInLegend: false,
      },
      {
        id: 'ema100',
        type: 'spline',
        name: 'EMA 100',
        color: ColorIndicator.EMA100,
        lineWidth: 1,
        showInLegend: false,
      },
      {
        id: 'ema200',
        type: 'spline',
        name: 'EMA 200',
        color: ColorIndicator.EMA200,
        lineWidth: 2,
        showInLegend: false,
      },
      {
        id: 'sma10',
        type: 'spline',
        name: 'SMA 10',
        color: ColorIndicator.SMA10,
        lineWidth: 1,
        showInLegend: false,
      },
      {
        id: 'sma200',
        type: 'spline',
        name: 'SMA 200',
        color: ColorIndicator.SMA200,
        lineWidth: 2,
        showInLegend: false,
        tooltip: {
          pointFormat: '',
        },
      },
    ],
  };

  @ViewChild(HighchartsChartComponent, { static: true })
  private readonly _highchartsChart: HighchartsChartComponent | null = null;

  private _chart$: Observable<Highcharts.Chart> = defer(() => {
    if (this._highchartsChart) {
      return this._highchartsChart.chartInstance;
    }

    return this._ngZone.onStable.asObservable().pipe(
      take(1),
      switchMap((_) => this._chart$)
    );
  });

  @Input()
  set selected(value: StockInstrument | null) {
    if (this.consolidationZonesIsExist) {
      this.chart?.removeAnnotation(0);
    }
    (this.chartOptions.series as Highcharts.SeriesCandlestickOptions[])[0].name = value?.ticker;
  }

  @Input()
  set data(value: [string | number, number, number, number, number][]) {
    this._candlestick$.next({ type: 'candlestick', data: value || [] });
  }

  @Input()
  set indicators(value: SeriesSplineOptions[] | null) {
    this._indicators$.next(value);
  }

  @Input()
  set text(value: string | number | null) {
    this._text$.next(value);
  }

  @Input()
  set consolidationZones(value: any) {
    this.chart?.removeAnnotation(0);

    if (!value) {
      return;
    }

    setTimeout(() => {
      const getF = function (): Highcharts.AnnotationsShapesOptions[] {
        return value.map((item: any) => {
          return {
            // type: 'rect',
            type: 'path',
            dashStyle: item.dash ? 'Dash' : null,
            fill: 'rgba(0,0,0,0)',
            stroke: item.color,
            strokeWidth: 1.5,
            ry: Math.PI,
            points: item.points,
          };
          // return item.points.map((data: any) => {
          //   return {
          //     // type: 'rect',
          //     type: 'path',
          //     dashStyle: item.dash ? 'Dash' : null,
          //     fill: 'rgba(0,0,0,0)',
          //     stroke: item.color,
          //     strokeWidth: 1.5,
          //     ry: Math.PI,
          //     points: data,
          //   };
          // }
        });
      };

      // {
      //   "id": 19180,
      //   "timeframe": 5,
      //   "startTime": "2024-02-19T00:00:00Z",
      //   "endTime": "2024-03-21T00:00:00Z",
      //   "high": 4.096,
      //   "low": 3.851,
      //   "isActive": false,
      //   "splash": false
      // },

      this.chart.addAnnotation({
        id: 0,
        draggable: '',
        shapes: getF(),

        // infinityLine: {
        //   typeOptions: {
        //     // type: 'ray',
        //     xAxis: 0,
        //     yAxis: 0,
        //     line: { fill: 'red' },

        //     points: [
        //       { x: new Date().setMonth(new Date().getMonth() - 1).valueOf(), y: 3 },
        //       { x: new Date().setMonth(new Date().getMonth()).valueOf(), y: 3 },
        //       { x: new Date().setMonth(new Date().getMonth() + 0.3).valueOf(), y: 2 },
        //     ],
        //   },
        // },
      });

      this.chart?.xAxis[0].setExtremes(
        new Date().setMonth(new Date().getMonth() - 2).valueOf(),
        new Date().setMonth(new Date().getMonth() + 1).valueOf()
      );
      this.chart?.yAxis[0].setExtremes();

      this.consolidationZonesIsExist = true;
    }, 10);
  }

  public chart!: Highcharts.StockChart;

  Highcharts: typeof Highcharts = Highcharts;

  @ViewChild('chart', { static: true })
  private readonly _chartElement!: ElementRef;

  constructor() {
    Highcharts.setOptions({
      lang: {
        rangeSelectorZoom: 'Таймфрейм',
        viewFullscreen: 'Полноэкранный режим',
        exitFullscreen: 'Выйти из полноэкранного режима',
        downloadPDF: 'Загрузить PDF',
        downloadJPEG: 'Загрузить JPEG',
        downloadPNG: 'Загрузить PNG',
        downloadSVG: 'Загрузить SVG',
        printChart: 'Распечатать',
        weekdays: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
        loading: 'Загрузка...',
        months: [
          'Январь',
          'Февраль',
          'Март',
          'Апрель',
          'Май',
          'Июнь',
          'Июль',
          'Август',
          'Сентябрь',
          'Октябрь',
          'Ноябрь',
          'Декабрь',
        ],
        shortMonths: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
      },
    });
  }

  ngOnInit(): void {
    const chart$ = this._chart$.pipe(
      filter((chart: Highcharts.Chart) => !!chart),
      takeUntilDestroyed(this._destroyRef),
      shareReplay({
        refCount: true,
        bufferSize: 1,
      })
    );

    chart$
      .pipe(
        switchMap((chart: Highcharts.Chart) =>
          this._indicators$
            .asObservable()
            .pipe(map((indicators: Highcharts.SeriesSplineOptions[] | null) => ({ chart, indicators })))
        )
      )
      .subscribe(({ chart, indicators }) => this._updateChartIndicators(chart, indicators));

    chart$
      .pipe(
        switchMap((chart: Highcharts.Chart) =>
          this._candlestick$
            .asObservable()
            .pipe(map((candlestick: Highcharts.SeriesCandlestickOptions) => ({ chart, candlestick })))
        )
      )
      .subscribe(({ chart, candlestick }) => this._updateChartCandlestick(chart, candlestick));

    chart$
      .pipe(
        switchMap((chart: Highcharts.Chart) =>
          this._text$.asObservable().pipe(
            distinctUntilChanged(),
            map((text: string | number | null) => ({ chart, text }))
          )
        )
      )
      .subscribe(({ chart, text }) => this._updateChartText(chart, text));
  }

  chartEvent($event: Highcharts.Chart) {
    this.chart = $event;
  }

  onMouseWheel(event: Event): void {
    if (!this.chart || !(event instanceof WheelEvent)) {
      return;
    }
    const leftBorder = this.chart.chartWidth - 60;
    const bottomBorder = this.chart.chartHeight - 60;
    const isInRightZone = event.x >= leftBorder && event.x <= this.chart.chartWidth && event.y <= bottomBorder;
    this.#zoomDirectionOut = event.deltaY < 0 ? -1 : 1;
    this.#zoomFromStartShare = {
      x: Math.min(Math.max(event.layerX - (this.chart.chartWidth - this.chart.plotWidth), 0) / this.chart.plotWidth, 1),
      y: Math.min((event.layerY - this.chart.plotTop) / this.chart.plotHeight, 1),
    };

    if (isInRightZone) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.updateZoomMode('y');
    } else {
      this.updateZoomMode('x');
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (this.#startPanZoomY == -1) {
      return;
    }
    const deltaY = this.#startPanZoomY - event.touches[0].clientY;
    this.#zoomDirectionOut = deltaY < 0 ? 1 : -1;
    this.#zoomFromStartShare = {
      x: 0.5,
      y: 0.5,
    };
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.updateZoomMode('y');
    this.#startPanZoomY = event.touches[0].clientY;
  }

  onTouchStart(event: TouchEvent): void {
    const leftBorder = this.chart.chartWidth - 60;
    const bottomBorder = this.chart.chartHeight - 60;
    if (
      event.touches[0].clientX >= leftBorder &&
      event.touches[0].clientX <= this.chart.chartWidth &&
      event.touches[0].clientY <= bottomBorder
    ) {
      this.#startPanZoomY = event.touches[0].clientY;
    }
  }

  onTouchEnd(): void {
    this.#startPanZoomY = -1;
  }

  private updateZoomMode(zoomMode: 'x' | 'y' | 'xy'): void {
    this.#zoomMode = zoomMode;
    const yAxis = this.chart?.yAxis[0];
    if (!yAxis || yAxis.max === undefined || yAxis.min === undefined) {
      return;
    }
    const xAxis = this.chart?.xAxis[0];
    if (!xAxis || xAxis.max === undefined || xAxis.min === undefined) {
      return;
    }

    const dataHeight = yAxis.max - yAxis.min;
    const plotHeight = this.chart.plotHeight;
    const deltaZoomY = (dataHeight / plotHeight) * 40;
    const maxDeltaY = deltaZoomY * this.#zoomFromStartShare.y;
    const minDeltaY = deltaZoomY - maxDeltaY;
    const newYMin = yAxis.min - this.#zoomDirectionOut * minDeltaY;
    const newYMax = yAxis.max + this.#zoomDirectionOut * maxDeltaY;

    // const dataWidth = xAxis.max - xAxis.min;
    // const plotWidtht = this.chart.plotWidth;
    // const deltaZoomX = dataWidth / plotWidtht * 40;
    // const minDeltaX = deltaZoomX * this.#zoomFromStartShare.x;
    // const maxDeltaX = deltaZoomX - minDeltaX;
    // const newXMin = xAxis.min - this.#zoomDirectionOut * minDeltaX;
    // const newXMax = xAxis.max + this.#zoomDirectionOut * maxDeltaX;

    if (this.#zoomMode === 'y') {
      yAxis.setExtremes(newYMin, newYMax, true, true);
      xAxis.setExtremes(this.#prevXExtremes[0], this.#prevXExtremes[1]);
    } else if (this.#zoomMode === 'x') {
      // xAxis.update({min: newXMin, max: newXMax});
      // xAxis.setExtremes(xAxis.min, xAxis.max);
    } else if (this.#zoomMode === 'xy') {
      // xAxis.update({min: newXMin, max: newXMax});
      // xAxis.setExtremes(xAxis.min, xAxis.max);
    }
    this.#prevXExtremes = [xAxis.min, xAxis.max];
  }

  private _updateChartIndicators(chart: Highcharts.Chart, indicators: Highcharts.SeriesSplineOptions[] | null): void {
    this._indicatorsName.forEach((name: string) => {
      const series = chart.get(name);
      if (series) {
        if (indicators === null) {
          (series as Highcharts.Series).data = [];
        } else {
          const indicator = indicators.find((item) => item.id === name) || { type: 'spline', data: [] };
          (series as Highcharts.Series).update(indicator);
        }
      }
    });
  }

  private _updateChartCandlestick(chart: Highcharts.Chart, candlestick: Highcharts.SeriesCandlestickOptions): void {
    const series = chart.get('primary');

    if (series) {
      (series as Highcharts.Series).update(candlestick);

      chart.xAxis[0].setExtremes(
        new Date().setMonth(new Date().getMonth() - 2).valueOf(),
        new Date().setMonth(new Date().getMonth() + 1).valueOf()
      );
    }
  }

  private _updateChartText(chart: Highcharts.Chart, text: string | number | null): void {
    if (this._text !== null) {
      this._text.destroy();
      this._text = null;
    }

    if (text === null) {
      return;
    }

    this._text = chart.renderer
      .g('custom-text')
      .translate(chart.plotWidth, chart.plotTop)
      .attr({ opacity: 0, zIndex: 7 })
      .add();

    let textSvg: Highcharts.SVGElement | null = chart.renderer
      .text(text.toString(), 0, 0)
      .attr({
        'font-size': '0.8em',
      })
      .add(this._text);
    this._textSvgWidth = Math.ceil(textSvg.getBBox().width + 16);

    textSvg.destroy();
    textSvg = null;

    chart.renderer.rect(0, 0, this._textSvgWidth, 22, 2).attr({ fill: '#e6e9ff', 'z-index': 3 }).add(this._text);
    chart.renderer
      .text(text.toString(), 8, 15.5)
      .attr({
        'font-size': '0.8em',
        'z-index': 5,
      })
      .add(this._text);

    this._text
      .translate(chart.plotWidth + chart.plotLeft - this._textSvgWidth - 35, chart.plotHeight + chart.plotTop - 25)
      .attr({ opacity: 1 });
  }
}
