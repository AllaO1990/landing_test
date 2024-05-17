import { EntryEnums } from './entry.enums';
import { EntryHeaderItem } from './entry.types';
import { sortNumber, sortText } from '../main.utils';

export const ENTRY_CONSTANTS: { [key in EntryEnums]: string } = {
  [EntryEnums.TITLE]: 'Вход',
  [EntryEnums.ADD_IDEA]: '+ Новая идея',
  [EntryEnums.SEARCH]: 'Поиск',
};

export const ENTRY_HEADER: EntryHeaderItem[] = [
  {
    name: 'date',
    label: `Дата <br> Кол.дн.`,
    sorter: (a: { date: { start: string } }, b: { date: { start: string } }) =>
      new Date(b.date.start).valueOf() - new Date(a.date.start).valueOf(),
  },
  {
    name: 'direction',
    label: 'Напр.',
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
    label: 'Цена',
    sorter: (a: { cost: number }, b: { cost: number }) =>
      sortNumber(a.cost, b.cost),
  },
  {
    name: 'enter',
    label: `Цена вх. <br>Кол-во`,
    sorter: (
      a: { enter: { price: number } },
      b: {
        enter: { price: number };
      }
    ) => sortNumber(a.enter.price, b.enter.price),
  },
  {
    name: 'target',
    label: `Цель <br> %/% депо`,
    sorter: (
      a: { target: { price: number } },
      b: {
        target: { price: number };
      }
    ) => sortNumber(a.target.price, b.target.price),
  },
  {
    name: 'stop',
    label: `Стоп <br> %/% депо`,
    sorter: (a: { stop: { price: number } }, b: { stop: { price: number } }) =>
      sortNumber(a.stop.price, b.stop.price),
  },
  {
    name: 'deposit',
    label: `Стоим. вх.<br>% депо`,
    sorter: (
      a: { deposit: { price: number } },
      b: {
        deposit: { price: number };
      }
    ) => sortNumber(a.deposit.price, b.deposit.price),
  },
  {
    name: 'luck',
    label: 'Успех %<br> Стратег.',
    sorter: (a: { luck: number }, b: { luck: number }) =>
      sortNumber(a.luck, b.luck),
  },
  {
    name: 'idea',
    label: 'Идея',
    sorter: (a: { idea: boolean }, b: { idea: boolean }) => +b.idea - +a.idea,
  },
];
