import { TableDataItem } from './table.types';
import { sortText } from 'utils/sort-text';

export const WRAPPER_TABLE_HEADER = [
  {
    name: 'date',
    text: 'Дата вх<br>Дата вых',
    sorter: (a: TableDataItem, b: TableDataItem) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
  },
  {
    name: 'positionType',
    text: 'Напр.',
    sorter: (a: TableDataItem, b: TableDataItem) => sortText(b.positionType, a.positionType),
  },
  {
    name: 'ticker',
    text: 'Тикер',
    sorter: (a: TableDataItem, b: TableDataItem) => sortText(b.instrument.ticker, a.instrument.ticker),
  },
  {
    name: 'entry',
    text: 'Цена уч.',
    sorter: (a: TableDataItem, b: TableDataItem) => b.entry.price - a.entry.price,
  },
  {
    name: 'entryPosition',
    text: 'К-во вход <br> Стоим. уч.',
    sorter: (a: TableDataItem, b: TableDataItem) => b.entry.amount - a.entry.amount,
  },
  {
    name: 'out',
    text: 'Цена вых.',
    sorter: (a: TableDataItem, b: TableDataItem) => b.out?.price - a.out?.price,
  },
  {
    name: 'outPosition',
    text: 'К-во выход <br> Стоим. вых.',
    sorter: (a: TableDataItem, b: TableDataItem) => b.out?.amount - a.out?.amount,
  },
  {
    name: 'dividend',
    text: 'Дивиденд',
    sorter: (a: TableDataItem, b: TableDataItem) => b.dividend - a.dividend,
  },
  {
    name: 'profitRealized',
    text: 'Приб. реализ.',
    sorter: (a: TableDataItem, b: TableDataItem) => b.lastPrice - a.lastPrice,
  },
  {
    name: 'remainderInPosition',
    text: 'К-во ост. <br> Стоим. ост.',
    sorter: (a: TableDataItem, b: TableDataItem) => b.lastPrice - a.lastPrice,
  },
  {
    name: 'profitNotRealized',
    text: 'Приб. нереализ.',
    sorter: (a: TableDataItem, b: TableDataItem) => b.lastPrice - a.lastPrice,
  },
  {
    name: 'result',
    text: 'Рез-т',
    sorter: (a: TableDataItem, b: TableDataItem) => b.lastPrice - a.lastPrice,
  },
  {
    name: 'deposit',
    text: '% к депо',
    sorter: (a: TableDataItem, b: TableDataItem) => b.lastPrice - a.lastPrice,
  },
  {
    name: 'strategy',
    text: 'Стратегия',
    sorter: (a: TableDataItem, b: TableDataItem) => sortText(b.strategy.type, a.strategy.type),
  },
  {
    name: 'broker',
    text: 'Брокер',
    sorter: (a: TableDataItem, b: TableDataItem) => sortText(b.broker, a.broker),
  },
  {
    name: 'comment',
    text: 'Коммент.',
    sorter: (a: TableDataItem, b: TableDataItem) => sortText(b.comment, a.comment),
  },
  {
    name: 'author',
    text: 'Идея',
    sorter: (a: TableDataItem, b: TableDataItem) => sortText(b.author, a.author),
  },
];
