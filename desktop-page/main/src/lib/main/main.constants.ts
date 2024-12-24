export const MAIN_FILTER_STOCK = [
  {
    id: ['shares'],
    name: 'Акции',
    disabled: false,
  },
  {
    id: ['futures'],
    name: 'Фьючерсы',
    disabled: false,
  },
  {
    id: ['currencies'],
    name: 'Валюта',
    disabled: false,
  },
  {
    id: ['metal'],
    name: 'Металлы',
    disabled: false,
  },
  {
    id: ['crypto'],
    name: 'Крипто',
    disabled: false,
  },
];

export const MAIN_TAB_MOBILE_LIST: { text: string; icon: string }[] = [
  {
    icon: '@tui.chart-line',
    text: 'График',
  },
  {
    icon: '@tui.list',
    text: 'Список',
  },
  {
    icon: '@tui.lightbulb',
    text: 'Идея',
  },
  {
    icon: '@tui.shopping-cart',
    text: 'Сделка',
  },
];

export const MAIN_TAB_TABLET_LIST: { text: string; icon: string }[] = [
  {
    icon: '@tui.chart-line',
    text: 'График',
  },
  {
    icon: '@tui.lightbulb',
    text: 'Идея',
  },
  {
    icon: '@tui.shopping-cart',
    text: 'Сделка',
  },
];
