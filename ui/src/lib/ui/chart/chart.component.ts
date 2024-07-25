import { ChangeDetectionStrategy, Component, ElementRef, inject, Input, ViewChild } from '@angular/core';

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

import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';
import { StockInstrument } from 'types/stock';
import { CommonModule } from '@angular/common';

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
  imports: [HighchartsChartModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent {
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  #zoomMode: 'x' | 'y' | 'xy' = 'xy';
  #prevXExtremes = [0, 0];
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
    xAxis: {
      ordinal: false,
      // endOnTick: true,
      // overscroll: '1%',

      // max: 25,
      maxPadding: 0.5,
      endOnTick: true,
    },
    yAxis: {
      // scrollbar: { enabled: true },
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
      animation: false,
      zooming: {
        // type: 'y',
        // key: 'ctrl',
        mouseWheel: {type: 'x'},
        resetButton: { position: { x: -60 } },
      },
      panning: { enabled: true, type: 'xy' },
      // panKey: 'shift',
    },
    plotOptions: {
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
    legend: { enabled: false },

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
        color: 'red',
        linkedTo: 'primary',
        params: { period: 200 },
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b style="font-size:12px"> {series.name} </b>' +
            '<p style="font-size:12px">{point.y}</p>',
        },
      },
      {
        type: 'ema',
        color: 'gray',
        linkedTo: 'primary',
        params: { period: 30 },
        lineWidth: 0.5,
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b style="font-size:12px"> {series.name} </b>' +
            '<p style="font-size:12px">{point.y}</p>',
        },
      },
      {
        type: 'ema',
        color: 'blue',
        linkedTo: 'primary',
        params: { period: 20 },
        lineWidth: 0.5,
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b style="font-size:12px"> {series.name} </b>' +
            '<p style="font-size:12px">{point.y}</p>',
        },
      },
      {
        type: 'sma',
        color: 'rgba(250, 150, 150, 1)',
        linkedTo: 'primary',
        params: { period: 200 },
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b style="font-size:12px"> {series.name} </b>' +
            '<p style="font-size:12px">{point.y}</p>',
        },
      },
      {
        type: 'sma',
        color: 'orange',
        linkedTo: 'primary',
        params: { period: 10 },
        lineWidth: 0.5,
        tooltip: {
          pointFormat:
            '<span style="color:{point.color}">●</span>' +
            '<b style="font-size:12px"> {series.name} </b>' +
            '<p style="font-size:12px">{point.y}</p>',
        },
      },
    ],
  };

  @Input()
  set selected(value: StockInstrument | null) {
    if (this.consolidationZonesIsExist) {
      this.chart?.removeAnnotation(0);
    }
    (this.chartOptions.series as Highcharts.SeriesCandlestickOptions[])[0].name = value?.ticker;
  }

  @Input()
  set selectedIdea(value: any) {
    // console.log(value);
    return;
  }

  @Input()
  set data(value: any[]) {
    this.chart?.zoomOut();
    (this.chartOptions.series as Highcharts.SeriesCandlestickOptions[])[0].data = value;
    // this.updateExtremes
    // this.chart?.xAxis[0].setExtremes();
    // this.chart?.yAxis[0].setExtremes();
    
    this.chart?.update(this.chartOptions);
    const xAxis = this.chart?.xAxis[0];
    this.#prevXExtremes = [xAxis.min ?? 0, xAxis.max ?? 0];
    // this.chart?.xAxis[0].setExtremes(undefined, undefined);
    // this.chart?.yAxis[0].setExtremes(undefined, undefined);
  }

  @Input()
  set consolidationZones(value: any) {
    this.chart?.removeAnnotation(0);

    if (!value) {
      return;
    }

    const getF = function (): Highcharts.AnnotationsShapesOptions[] {
      return value.map((item: any) => {
        return item.points.map((data: any) => {
          return {
            // type: 'rect',
            type: 'path',

            dashStyle: item.dash ? 'Dash' : null,
            fill: 'rgba(0,0,0,0)',
            stroke: item.color,
            strokeWidth: 1.5,
            ry: Math.PI,
            points: data,
          };
        });
      });
    };

    this.chart.addAnnotation({
      id: 0,
      draggable: '',
      shapes: getF().flat(),

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
      }
    });
  }

  chartEvent($event: Highcharts.Chart) {
    this.chart = $event;

    console.log('init');
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
      x: Math.min(Math.max((event.layerX - (this.chart.chartWidth-this.chart.plotWidth)), 0) / this.chart.plotWidth, 1),
      y: Math.min((event.layerY - this.chart.plotTop) / this.chart.plotHeight, 1),
    }

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
    }
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

  private updateZoomMode(zoomMode: 'x' | 'y' | 'xy',): void {
    this.#zoomMode = zoomMode;
    const yAxis = this.chart?.yAxis[0]
    if (!yAxis || yAxis.max === undefined || yAxis.min === undefined) {
      return;
    }
    const xAxis = this.chart?.xAxis[0];
    if (!xAxis || xAxis.max === undefined || xAxis.min === undefined) {
      return;
    }
    
    const dataHeight = yAxis.max - yAxis.min;
    const plotHeight = this.chart.plotHeight;
    const deltaZoomY = dataHeight / plotHeight * 40;
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
}
