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
    chart: {
      events: {
        click: (event) => {
          console.log(event);
        },
      },
    },
    plotOptions: {
      series: {
        point: {
          events: {
            click: (event) => {
              console.log(event);
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
        showInLegend: true,
        lastVisiblePrice: {
          enabled: true,
          label: {
            enabled: true,
            formatter: (value: number) => {
              return value.toFixed(2);
            },
          },
        },
      },
      sma: {
        // color: 'green',
        marker: { enabled: false },
        showInLegend: true,
        lastVisiblePrice: {
          enabled: true,
          label: {
            enabled: true,
            formatter: (value: number) => {
              return value.toFixed(2);
            },
          },
        },
      },
    },
    tooltip: {
      shape: 'circle',
      headerShape: 'callout',
      borderWidth: 0,
      shadow: false,
      positioner: function (width, height, point) {
        const chart = this.chart;
        let position;

        if (point.isHeader) {
          position = {
            x: Math.max(
              // Left side limit
              this.chart.plotLeft,
              Math.min(
                point.plotX + chart.plotLeft - width / 2,
                // Right side limit
                // @ts-expect-error: Unreachable code error
                chart.chartWidth - width - chart.marginRight
              )
            ),
            y: point.plotY,
          };
        } else {
          position = {
            x: point.series.chart.plotLeft,
            // @ts-expect-error: Unreachable code error
            y: point.series.yAxis.top - chart.plotTop,
          };
        }

        return position;
      },
    },
    legend: { enabled: true },
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
      },
      {
        type: 'ema',
        linkedTo: 'primary',
        params: { period: 200 },
      },
      {
        type: 'ema',
        linkedTo: 'primary',
        params: { period: 30 },
      },
      {
        type: 'sma',
        linkedTo: 'primary',
        params: { period: 200 },
      },
      {
        type: 'sma',
        linkedTo: 'primary',
        params: { period: 10 },
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

  constructor() {}

  ngOnInit(): void {
    console.log(this.chart);
  }
}
