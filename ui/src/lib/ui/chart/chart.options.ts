import * as Highcharts from 'highcharts/highstock';
import { PositionObject } from 'highcharts';
import { ColorIndicator } from 'types/color';

function createRect(chart: Highcharts.Chart) {
  const yAxis: any = chart.yAxis[0];

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
}

export const HIGHCHARTS_OPTIONS: Highcharts.Options = {
  boost: {
    useGPUTranslations: true,
    usePreallocated: true,
  },
  accessibility: {
    enabled: false,
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
  navigator: {
    enabled: false,
  },
  stockTools: {
    gui: {
      visible: false,
    },
  },
  tooltip: {
    shape: 'rect',
    shadow: false,
    headerFormat: undefined,
    borderRadius: 0,
    stickOnContact: false,
    positioner: (): PositionObject => ({
      x: 10,
      y: 10,
    }),
  },
  scrollbar: {
    enabled: false,
  },
  series: [
    {
      id: 'candlestick',
      type: 'candlestick',
      name: '',
      data: [],
      tooltip: {
        pointFormat:
          '<span style="color:{point.color}">●</span>' +
          '<b> {series.name} </b> <br/>' +
          'ОТКР: {point.open} <br/>' +
          'МАКС: {point.high} <br/>' +
          'МИН: {point.low} <br/>' +
          'ЗАКР: {point.close}',
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
      id: 'sma20',
      type: 'spline',
      name: 'SMA 20',
      color: ColorIndicator.SMA20,
      lineWidth: 1,
      showInLegend: false,
    },
    {
      id: 'sma30',
      type: 'spline',
      name: 'SMA 30',
      color: ColorIndicator.SMA30,
      lineWidth: 1,
      showInLegend: false,
    },
    {
      id: 'sma50',
      type: 'spline',
      name: 'SMA 50',
      color: ColorIndicator.SMA50,
      lineWidth: 1,
      showInLegend: false,
    },
    {
      id: 'sma100',
      type: 'spline',
      name: 'SMA 100',
      color: ColorIndicator.SMA100,
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
    },
  ],
};

export const HIGHCHARTS_LANG: Highcharts.LangOptions = {
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
};
