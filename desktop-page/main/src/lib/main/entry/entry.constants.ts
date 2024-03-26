import { EntryEnums } from './entry.enums';

export const ENTRY_CONSTANTS: { [key in EntryEnums]: string } = {
  [EntryEnums.TITLE]: 'Вход',
  [EntryEnums.ADD_IDEA]: '+ Новая идея',
};

export const ENTRY_HEADER: { name: string; label: string }[] = [
  {
    name: 'date',
    label: 'Дата',
  },
  {
    name: 'direction',
    label: 'Направ.',
  },
  {
    name: 'ticker',
    label: 'Тикер',
  },
  {
    name: 'cost',
    label: 'Цена',
  },
  {
    name: 'enter',
    label: 'Цена вх.',
  },
  {
    name: 'stop',
    label: 'Стоп',
  },
  {
    name: 'deposit',
    label: 'Кол-во\n% депо',
  },
  {
    name: 'luck',
    label: 'Успех %\nУсловия',
  },
  {
    name: 'idea',
    label: 'Идея\nVANYA',
  },
];
