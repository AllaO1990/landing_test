import { OutHeaderItem } from './out.types';

export const OUT_HEADER: OutHeaderItem[][] = [
  [
    {
      name: 'direction',
      label: 'Направ.',
      sorter: null,
      rowspan: 2,
      colspan: 1,
    },
    {
      name: 'ticker',
      label: 'Тикер',
      sorter: null,
      rowspan: 2,
      colspan: 1,
    },
    {
      name: 'cost',
      label: 'Цена',
      sorter: null,
      rowspan: 2,
      colspan: 1,
    },
    {
      name: 'enter',
      label: 'Цена вх.',
      sorter: null,
      rowspan: 2,
      colspan: 1,
    },
    {
      name: 'target1',
      label: 'Цель',
      rowspan: 1,
      colspan: 2,
      sorter: null,
    },
    {
      name: 'target2',
      label: '',
      rowspan: null,
      colspan: null,
      sorter: null,
    },
    {
      name: 'stop',
      label: 'Стоп',
      sorter: null,
      rowspan: 2,
      colspan: 1,
    },
    {
      name: 'deposit',
      label: 'Кол-во\n% депо',
      sorter: null,
      rowspan: 2,
      colspan: 1,
    },
  ],
  [
    {
      name: 'target1',
      label: 'Цель 1',
      sorter: null,
      rowspan: 1,
      colspan: 1,
    },
    {
      name: 'target2',
      label: 'Цель 2',
      sorter: null,
      rowspan: 1,
      colspan: 1,
    },
  ],
];

export const OUT_COLUMNS: string[] = [
  'direction',
  'ticker',
  'cost',
  'target1',
  'target2',
  'stop',
  'deposit',
];
