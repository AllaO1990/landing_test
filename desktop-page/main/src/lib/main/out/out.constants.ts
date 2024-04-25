import { OutHeaderItem } from './out.types';
import { sortNumber, sortText } from '../main.utils';

export const OUT_HEADER: OutHeaderItem[][] = [
  [
    {
      name: 'direction',
      label: 'Направ.',
      sorter: (a: { direction: string }, b: { direction: string }) => sortText(a.direction, b.direction),
      rowspan: 2,
      colspan: 1
    },
    {
      name: 'ticker',
      label: 'Тикер',
      sorter: (a: { ticker: string }, b: { ticker: string }) => sortText(a.ticker, b.ticker),
      rowspan: 2,
      colspan: 1
    },
    {
      name: 'cost',
      label: 'Цена',
      sorter: (a: { cost: number }, b: { cost: number }) => sortNumber(a.cost, b.cost),
      rowspan: 2,
      colspan: 1
    },
    {
      name: 'enter',
      label: 'Цена вх.',
      sorter: (a: { enter: number }, b: { enter: number }) => sortNumber(a.enter, b.enter),
      rowspan: 2,
      colspan: 1
    },
    {
      name: 'target',
      label: 'Цель',
      rowspan: 1,
      colspan: 2,
      sorter: null
    },
    {
      name: 'stop',
      label: 'Стоп',
      rowspan: 2,
      colspan: 1,
      sorter: (a: { stop: { price: number } }, b: { stop: { price: number } }) => sortNumber(a.stop.price, b.stop.price)
    },
    {
      name: 'out',
      label: 'Выход часть <br> Цена/Кол-во',
      rowspan: 2,
      colspan: 1,
      sorter: (a: { out: { price: number } }, b: { out: { price: number } }) => sortNumber(a.out.price, b.out.price)
    },
    {
      name: 'deposit',
      label: 'Кол-во %<br> депо',
      rowspan: 2,
      colspan: 1,
      sorter: (a: { deposit: { value: number } }, b: {
        deposit: { value: number }
      }) => sortNumber(a.deposit.value, b.deposit.value)
    }
  ],
  [
    {
      name: 'target1',
      label: 'Цель 1',
      rowspan: 1,
      colspan: 1,
      sorter: (a: { target1: number }, b: { target1: number }) => sortNumber(a.target1, b.target1)
    },
    {
      name: 'target2',
      label: 'Цель 2',
      rowspan: 1,
      colspan: 1,
      sorter: (a: { target2: number }, b: { target2: number }) => sortNumber(a.target2, b.target2)
    }
  ]
];

export const OUT_COLUMNS: string[] = [
  'direction',
  'ticker',
  'cost',
  'enter',
  'target1',
  'target2',
  'stop',
  'out',
  'deposit'
];
