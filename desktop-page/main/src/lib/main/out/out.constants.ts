import { OutHeaderItem } from './out.types';
import { sortNumber, sortText } from '../main.utils';
import { OutEnums } from './out.enums';

export const OUT_HEADER: OutHeaderItem[] = [
  {
    name: 'date',
    label: `Дата<br>Кол.дн.`,
    sorter: (a: { date: { start: string } }, b: { date: { start: string } }) =>
      new Date(b.date.start).valueOf() - new Date(a.date.start).valueOf(),
  },
  {
    name: 'direction',
    label: '',
    sorter: (a: { direction: string }, b: { direction: string }) =>
      sortText(a.direction, b.direction),
  },
  {
    name: 'ticker',
    label: 'Тикер',
    sorter: (a: { ticker: string }, b: { ticker: string }) =>
      sortText(a.ticker, b.ticker),
  },
  {
    name: 'cost',
    label: 'Цена<br>Стоим.',
    sorter: (
      a: { cost: { price: number } },
      b: {
        cost: { price: number };
      }
    ) => sortNumber(a.cost.price, b.cost.price),
  },
  {
    name: 'enter',
    label: 'Цена уч <br> Стоим уч.',
    sorter: (
      a: { enter: { price: number } },
      b: {
        enter: { price: number };
      }
    ) => sortNumber(a.enter.price, b.enter.price),
  },
  {
    name: 'profit',
    label: '%',
    title: 'Прибль :',
    sorter: (
      a: { profit: { percentage: number } },
      b: {
        profit: { percentage: number };
      }
    ) => sortNumber(a.profit.percentage, b.profit.percentage),
  },
  {
    name: 'target1',
    label: 'Цель 1<br>К-во выход',
    sorter: (
      a: { target1: { price: number } },
      b: {
        target1: { price: number };
      }
    ) => sortNumber(a.target1.price, b.target1.price),
  },
  {
    name: 'target2',
    label: 'Цель 2<br>К-во выход',
    sorter: (
      a: { target2: { price: number } },
      b: {
        target2: { price: number };
      }
    ) => sortNumber(a.target2.price, b.target2.price),
  },
  {
    name: 'stop',
    label: 'Стоп',
    sorter: (a: { stop: { price: number } }, b: { stop: { price: number } }) =>
      sortNumber(a.stop.price, b.stop.price),
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
    sorter: (
      a: { deposit: { value: number } },
      b: {
        deposit: { value: number };
      }
    ) => sortNumber(a.deposit.value, b.deposit.value),
  },
  {
    name: 'result',
    label: 'Рез-т <br> сделки',
    sorter: (
      a: { result: { price: number } },
      b: {
        result: { price: number };
      }
    ) => sortNumber(a.result.price, b.result.price),
  },
];

export const OUT_CONSTANTS: { [key in OutEnums]: string } = {
  [OutEnums.TITLE]: 'Выход',
  [OutEnums.SEARCH]: 'Поиск',
};
