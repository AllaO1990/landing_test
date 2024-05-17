import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';

import * as Highcharts from 'highcharts/highstock';

import HC_exporting from 'highcharts/modules/exporting';

import { HighchartsChartModule } from 'highcharts-angular';
import HIndicatorsAll from 'highcharts/indicators/indicators-all';
import HAnnotationsAdvanced from 'highcharts/modules/annotations-advanced';
import HDragPanes from 'highcharts/modules/drag-panes';
import HFullScreen from 'highcharts/modules/full-screen';
import HPriceIndicator from 'highcharts/modules/price-indicator';
import HStockTools from 'highcharts/modules/stock-tools';
import { Observable } from 'rxjs';

import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';

HC_exporting(Highcharts);

HIndicatorsAll(Highcharts);
HDragPanes(Highcharts);
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
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  public readonly selected$: Observable<any> = this._store.selected$;

  update = false;

  chartOptions: Highcharts.Options = {
    boost: { useGPUTranslations: true, usePreallocated: true },
    navigator: { enabled: false },
    credits: { enabled: false },
    xAxis: {
      ordinal: false,
      // endOnTick: true,
      // overscroll: '1%',

      // max: 25,
      maxPadding: 0.5,
    },
    yAxis: {
      scrollbar: { enabled: true },
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
    chart: {
      zooming: {
        mouseWheel: { type: 'xy' },
      },
      panning: { enabled: true, type: 'xy' },
      panKey: 'shift',

      events: {
        click: (event) => {},
      },
    },
    plotOptions: {
      series: {
        point: {
          events: {
            click: (event) => {
              // console.log(event);
            },
            mouseOver: () => {
              // console.log(event);
            },
          },
        },
      },
      candlestick: {
        color: '#ff0043',
        lineColor: '#ff0043',
        upColor: '#00a281',
        upLineColor: '#00a281',
        allowPointSelect: true,
      },
      ema: {
        // color: 'red',
        marker: { enabled: false },
        lastVisiblePrice: {
          enabled: true,
          label: {
            enabled: false,
            formatter: (value: number) => {
              return value.toFixed(2);
            },
          },
        },
      },
      sma: {
        // color: 'green',
        marker: { enabled: false },
        lastVisiblePrice: {
          enabled: false,
          label: {
            enabled: true,
            formatter: (value: number) => {
              return value.toFixed(2);
            },
          },
        },
      },
    },
    rangeSelector: {
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
      selected: 2,
    },
    tooltip: {
      shape: 'rect',
      headerShape: 'callout',
      borderWidth: 0,
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
    legend: { enabled: false },
    // rangeSelector: {
    //   selected: 1,
    // },
    series: [
      {
        type: 'candlestick',
        name: 'USD to EUR',
        data: [],
        id: 'primary',
        showInLegend: false,
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
        type: 'ema',
        linkedTo: 'primary',
        params: { period: 200 },
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b> {series.name} </b>' +
            '{point.y} ',
        },
      },
      {
        type: 'ema',
        linkedTo: 'primary',
        params: { period: 30 },
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b> {series.name} </b>' +
            '{point.y} ',
        },
      },
      {
        type: 'sma',
        linkedTo: 'primary',
        params: { period: 200 },
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b> {series.name} </b>' +
            '{point.y} ',
        },
      },
      {
        type: 'sma',
        linkedTo: 'primary',
        params: { period: 10 },
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b> {series.name} </b>' +
            '{point.y} ',
        },
      },
    ],
  };

  @Input()
  set selected(value: any) {
    (
      this.chartOptions.series as Highcharts.SeriesCandlestickOptions[]
    )[0].name = value?.value.ticker;
  }

  @Input()
  set data(value: any[]) {
    (
      this.chartOptions.series as Highcharts.SeriesCandlestickOptions[]
    )[0].data = value?.reverse();

    this.update = true;
  }

  public chart: any;

  Highcharts: typeof Highcharts = Highcharts;

  @ViewChild('chart', { static: true })
  private readonly _chartElement!: ElementRef;

  constructor() {
    Highcharts.setOptions({
      lang: {
        rangeSelectorZoom: 'Таймфрейм',
        weekdays: [
          'Воскресенье',
          'Понедельник',
          'Вторник',
          'Среда',
          'Четверг',
          'Пятница',
          'Суббота',
        ],
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
        shortMonths: [
          'Янв',
          'Фев',
          'Мар',
          'Апр',
          'Май',
          'Июн',
          'Июл',
          'Авг',
          'Сен',
          'Окт',
          'Ноя',
          'Дек',
        ],
      },
    });
  }

  ngOnInit(): void {}
}
