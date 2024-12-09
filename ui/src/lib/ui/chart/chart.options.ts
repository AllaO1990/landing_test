import * as Highcharts from 'highcharts/highstock';
import { PositionObject } from 'highcharts';

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
