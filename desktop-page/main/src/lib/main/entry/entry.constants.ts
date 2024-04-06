import { EntryEnums } from './entry.enums';
import { EntryHeaderItem } from './entry.types';

export const ENTRY_CONSTANTS: { [key in EntryEnums]: string } = {
  [EntryEnums.TITLE]: 'Вход',
  [EntryEnums.ADD_IDEA]: '+ Новая идея',
};

export const ENTRY_HEADER: EntryHeaderItem[] = [
  {
    name: 'date',
    label: 'Дата',
    sorter: (a: { date: string }, b: { date: string }) =>
      new Date(b.date).valueOf() - new Date(a.date).valueOf(),
  },
  {
    name: 'direction',
    label: 'Направ.',
    sorter: null,
  },
  {
    name: 'ticker',
    label: 'Тикер',
    sorter: null,
  },
  {
    name: 'cost',
    label: 'Цена',
    sorter: null,
  },
  {
    name: 'enter',
    label: 'Цена вх.',
    sorter: null,
  },
  {
    name: 'stop',
    label: 'Стоп',
    sorter: null,
  },
  {
    name: 'deposit',
    label: 'Кол-во\n% депо',
    sorter: null,
  },
  {
    name: 'luck',
    label: 'Успех %\nУсловия',
    sorter: null,
  },
  {
    name: 'idea',
    label: 'Идея\nVANYA',
    sorter: (a: { idea: boolean }, b: { idea: boolean }) => +b.idea - +a.idea,
  },
];
