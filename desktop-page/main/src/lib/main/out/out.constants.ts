import { OutHeaderItem } from './out.types';
import { sortNumber } from '../main.utils';
import { OutEnums } from './out.enums';
import { sortText } from 'utils/sort-text';

export const OUT_HEADER: OutHeaderItem[] = [
  {
    name: 'date',
    label: `Дата<br>Кол.дн.`,
    sorter: (a: { createdAt: string }, b: { createdAt: string }) =>
      new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
  },
  {
    name: 'direction',
    label: '',
    sorter: (a: { positionType: string }, b: { positionType: string }) => sortText(a.positionType, b.positionType),
  },
  {
    name: 'ticker',
    label: 'Тикер',
    sorter: (
      a: { instrument: { ticker: string } },
      b: {
        instrument: { ticker: string };
      }
    ) => sortText(a.instrument.ticker, b.instrument.ticker),
  },
  {
    name: 'cost',
    label: 'Цена<br>Стоим.',
    sorter: (
      a: { lastPrice: number },
      b: {
        lastPrice: number;
      }
    ) => sortNumber(a.lastPrice, b.lastPrice),
  },
  {
    name: 'enter',
    label: 'Цена уч <br> Стоим уч.',
    sorter: (
      a: { entry: { price: number } },
      b: {
        entry: { price: number };
      }
    ) => sortNumber(a.entry.price, b.entry.price),
  },
  {
    name: 'profit',
    label: 'Приб. %',
    title: 'Прибль',
    sorter: (
      a: { profit: number },
      b: {
        profit: number;
      }
    ) => sortNumber(a.profit, b.profit),
  },
  {
    name: 'target1',
    label: 'Цель текущ.<br>К-во выход',
    sorter: (
      a: { targets: { price: number }[] },
      b: {
        targets: { price: number }[];
      }
    ) => sortNumber(a.targets[0].price, b.targets[0].price),
  },
  {
    name: 'stop',
    label: 'Стоп',
    sorter: (a: { stop: { price: number } }, b: { stop: { price: number } }) => sortNumber(a.stop.price, b.stop.price),
  },
  // {
  //   name: 'out',
  //   label: 'Выход часть <br> Цена/Кол-во',
  //   sorter: (a: { out: { price: number } }, b: { out: { price: number } }) =>
  //     sortNumber(a.out.price, b.out.price),
  // },
  {
    name: 'deposit',
    label: 'Кол-во <br>% депо',
    sorter: null,
  },
  {
    name: 'result',
    label: 'Рез-т <br> сделки',
    sorter: null,
  },
];

export const OUT_CONSTANTS: { [key in OutEnums]: string } = {
  [OutEnums.TITLE]: 'Выход',
  [OutEnums.SEARCH]: 'Поиск',
};
