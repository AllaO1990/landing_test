import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
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
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  ReplaySubject,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { WheelSetExtremes } from './chart.utils';
import { tuiFormatNumber } from '@taiga-ui/core';
import { CHART_INDICATORS_NAME } from './chart.constants';

HC_exporting(Highcharts);

HIndicatorsAll(Highcharts);
HDragPanes(Highcharts);
HDraggablePoints(Highcharts);
HAnnotationsAdvanced(Highcharts);
HPriceIndicator(Highcharts);
HFullScreen(Highcharts);
HStockTools(Highcharts);

type SeriesSpline = Highcharts.SeriesSplineOptions & { instrument: string };
type Zones = { data: Highcharts.AnnotationsOptions[]; instrument: string };

let CHART_INCREMENT = 2;

@Component({
  selector: 'vt-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  standalone: true,
  imports: [HighchartsChartModule, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  private readonly _indicatorsName: string[] = CHART_INDICATORS_NAME;
  private readonly _zonesName: string[] = ['zones-5', 'zones-12', 'zones-13', 'zones-idea', 'zones-watch', 'lines'];
  private readonly _instrument$: Subject<any> = new BehaviorSubject(null);
  private readonly _indicators$: Subject<SeriesSpline[] | null> = new BehaviorSubject<SeriesSpline[] | null>(null);
  private readonly _zone$: Subject<Zones | null> = new BehaviorSubject<Zones | null>(null);
  private readonly _chart$: Subject<Highcharts.Chart | null> = new BehaviorSubject<Highcharts.Chart | null>(null);
  private readonly _text$: Subject<{ data: any; instrument: string } | null> = new ReplaySubject(1);

  private _text: Highcharts.SVGElement | null = null;
  private _textSvgWidth = 0;
  private _prevZonesName: string[] = [];
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
            const min = new Date(xAxis.max).setMonth(new Date().getMonth() - 4);
            const max = new Date(xAxis.max).setMonth(new Date().getMonth() + 1);

            (xAxis as Highcharts.Axis).setExtremes(min, max, true, false);
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
    rangeSelector: {
      inputEnabled: false,
      allButtonsEnabled: true,
      buttons: [
        {
          type: 'year',
          count: 2,
          text: 'День',
          events: {
            click: (event: Event) => {
              this.event.emit({ type: 'buttonDay', event });
            },
          },
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
          events: {
            click: (event: Event) => {
              this.event.emit({ type: 'buttonWeek', event });
            },
          },
          preserveDataGrouping: true,
          dataGrouping: {
            forced: true,
            units: [['week', [1]]],
          },
        },
        {
          type: 'all',
          text: 'Месяц',
          events: {
            click: (event: Event) => {
              this.event.emit({ type: 'buttonMonth', event });
            },
          },
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
    plotOptions: {
      candlestick: {
        navigatorOptions: {
          connectNulls: true,
        },
        color: '#ff0043',
        lineColor: '#ff0043',
        upColor: '#00a281',
        upLineColor: '#00a281',
        dataGrouping: {
          forced: false,
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
        states: {
          hover: {
            enabled: false,
          },
        },
        tooltip: {
          pointFormatter: function () {
            if (!this.y) {
              return '';
            }

            return `<span style="color:${this.color}">●</span> ${this.series.name}: ${tuiFormatNumber(this.y, {
              precision: CHART_INCREMENT,
            })}`;
          },
        },
      },
    },
    xAxis: {
      startOnTick: false,
      endOnTick: false,
      ordinal: false,
      minPadding: 50,
      maxPadding: 0.5,
      crosshair: {
        // snap: false,
        dashStyle: 'LongDash',
        label: {
          backgroundColor: '#666',
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
          formatter: (value: number) => tuiFormatNumber(value, { precision: CHART_INCREMENT }),
          style: {
            zIndex: 50,
          },
        },
      },
    },
  };

  protected readonly Highcharts: typeof Highcharts = Highcharts;

  candlesEmpty = false;

  chartOptions: Highcharts.Options = Object.assign({}, HIGHCHARTS_OPTIONS, this._chartOptions);

  @Input()
  set data(instrument: any | null) {
    this.candlesEmpty = instrument.candles === null;

    if (instrument.candles !== null) {
      this._instrument$.next(instrument);
    }
  }

  @Input()
  set indicators(value: SeriesSpline[] | null) {
    this._indicators$.next(value);
  }

  @Input()
  set zones(value: Zones | null) {
    this._zone$.next(value);
  }

  @Input()
  set text(value: { data: any; instrument: string } | null) {
    this._text$.next(value);
  }

  @Output() event: EventEmitter<{ type: string; event: Event }> = new EventEmitter();

  constructor() {
    Highcharts.setOptions({
      lang: HIGHCHARTS_LANG,
    });
  }

  onMouseWheel(event: WheelEvent): void {
    // console.log(event);
  }

  onTouchMove(event: TouchEvent | MouseEvent): void {
    // console.log(event);
  }

  onInstance(chart: Highcharts.Chart): void {
    this._chart$.next(chart);
  }

  ngAfterViewInit(): void {
    const chart$ = this._chart$.asObservable().pipe(
      filter((chart: Highcharts.Chart | null): chart is Highcharts.Chart => chart !== null),
      shareReplay(1)
    );

    const chartWithInstrumentId$ = this._chart$.asObservable().pipe(
      filter((chart: Highcharts.Chart | null): chart is Highcharts.Chart => chart !== null),
      switchMap((chart: Highcharts.Chart) =>
        this._instrument$.asObservable().pipe(
          filter((instrument: any | null): instrument is any => instrument !== null),
          map((instrument) => ({ chart, id: instrument.id }))
        )
      )
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
        const candlestick = chart.get('candlestick');

        if (candlestick) {
          CHART_INCREMENT = instrument.increment;

          (candlestick as any).setName(instrument.name);
          (candlestick as Highcharts.Series).setData(instrument.candles, true, false, false);

          chart.yAxis[0].setExtremes();
        }
      });

    chartWithInstrumentId$
      .pipe(
        switchMap(({ chart, id }: { chart: Highcharts.Chart; id: string }) =>
          this._indicators$.asObservable().pipe(
            filter((indicators: SeriesSpline[] | null): indicators is SeriesSpline[] => indicators !== null),
            map((indicators: SeriesSpline[]) => indicators.filter((item) => item.instrument === id)),
            map((indicators: SeriesSpline[]) => ({ chart, indicators }))
          )
        )
      )
      .subscribe(({ chart, indicators }: { chart: Highcharts.Chart; indicators: SeriesSpline[] }) => {
        this._indicatorsName.forEach((name: string) => {
          const series = chart.get(name);
          const indicator = indicators.find((item) => item && item.id === name) || { type: 'spline', data: [] };

          if (series) {
            (series as Highcharts.Series).setData(indicator.data as any[], false, false);
          }
        });

        chart.redraw(false);
      });

    chartWithInstrumentId$
      .pipe(
        tap(({ chart }: { chart: Highcharts.Chart; id: string }) => this._removeZones([], chart)),
        switchMap(({ chart, id }: { chart: Highcharts.Chart; id: string }) =>
          this._zone$.asObservable().pipe(
            map((zones: Zones | null) => {
              if (zones === null) {
                return { chart, zones: [] };
              }

              return { chart, zones: zones.instrument === id ? zones.data : [] };
            })
          )
        )
      )
      .subscribe(({ chart, zones }: { chart: Highcharts.Chart; zones: Highcharts.AnnotationsOptions[] }) => {
        this._removeZones(zones, chart);
        this._addZones(zones, chart);
      });

    chartWithInstrumentId$
      .pipe(
        switchMap(({ chart, id }: { chart: Highcharts.Chart; id: string }) =>
          this._text$.asObservable().pipe(
            map((value: { data: any; instrument: string } | null) => {
              if (value === null) {
                return null;
              }

              if (value.instrument !== id) {
                return null;
              }

              return value.data;
            }),
            distinctUntilChanged(),
            map((data: any) => ({ chart, data }))
          )
        )
      )
      .subscribe(({ chart, data }: { chart: Highcharts.Chart; data: any }) => {
        setTimeout(() => {
          this._updateChartText(chart, data);
        }, 300);
      });
  }

  ngOnDestroy(): void {
    this._chart$.complete();
    this._instrument$.complete();
  }

  private _addZones(zones: Highcharts.AnnotationsOptions[], chart: Highcharts.Chart): void {
    const ids: string[] = zones.map((zone: Highcharts.AnnotationsOptions) => zone.id as string);

    zones.forEach((item: Highcharts.AnnotationsOptions) => {
      if (!this._prevZonesName.includes(item.id as string)) {
        chart.addAnnotation(item, false);
      }
    });

    this._prevZonesName = ids;
    chart.redraw(false);
  }

  private _removeZones(zones: Highcharts.AnnotationsOptions[], chart: Highcharts.Chart): void {
    const ids: string[] = zones.map((zone: Highcharts.AnnotationsOptions) => zone.id as string);

    this._zonesName
      .filter((id: string) => !ids.includes(id))
      .forEach((id: string) => {
        chart.removeAnnotation(id);
      });
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

    this._text.translate(chart.plotLeft, chart.plotHeight + chart.plotTop - 25).attr({ opacity: 1 });
  }
}
