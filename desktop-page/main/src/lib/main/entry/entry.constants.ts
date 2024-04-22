import {EntryEnums} from './entry.enums';
import {EntryHeaderItem} from './entry.types';

export const ENTRY_CONSTANTS: { [key in EntryEnums]: string } = {
  [EntryEnums.TITLE]: 'Вход',
  [EntryEnums.ADD_IDEA]: '+ Новая идея',
};

const sortText = (a: string, b: string): -1 | 0 | 1 => {
  const nameA: string = (a).toUpperCase();
  const nameB: string = (b).toUpperCase();

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  return 0;
};

const sortNumber = (a: number, b: number): number => {
  return b - a;
}


export const ENTRY_HEADER: EntryHeaderItem[] = [
  {
    name: 'date',
    label: `Дата <br> Кол-во дней`,
    sorter: (a: { date: { start: string } }, b: { date: { start: string } }) =>
      new Date(b.date.start).valueOf() - new Date(a.date.start).valueOf(),
  },
  {
    name: 'direction',
    label: 'Направ.',
    sorter: (a: { direction: string }, b: { direction: string }) => sortText(a.direction, b.direction),
  },
  {
    name: 'ticker',
    label: 'Тикер',
    sorter: (a: { ticker: string }, b: { ticker: string }) => sortText(a.ticker, b.ticker),
  },
  {
    name: 'cost',
    label: 'Цена',
    sorter: (a: { cost: number }, b: { cost: number }) => sortNumber(a.cost, b.cost),
  },
  {
    name: 'enter',
    label: `Цена вх. <br>Стоим вх`,
    sorter: (a: { enter: { price: number } }, b: { enter: { price: number } }) => sortNumber(a.enter.price, b.enter.price),
  },
  {
    name: 'target',
    label: 'Цель',
    sorter: (a: { target: { price: number } }, b: { target: { price: number } }) => sortNumber(a.target.price, b.target.price),
  },
  {
    name: 'stop',
    label: 'Стоп',
    sorter: (a: { stop: { price: number } }, b: { stop: { price: number } }) => sortNumber(a.stop.price, b.stop.price),
  },
  {
    name: 'deposit',
    label: `Кол-во<br>% депо`,
    sorter: (a: { deposit: { price: number } }, b: { deposit: { price: number } }) => sortNumber(a.deposit.price, b.deposit.price),
  },
  {
    name: 'luck',
    label: 'Успех %<br> Условия',
    sorter: (a: { luck: { value: number } }, b: { luck: { value: number } }) => sortNumber(a.luck.value, b.luck.value),

  },
  {
    name: 'idea',
    label: 'Идея\nVANYA',
    sorter: (a: { idea: boolean }, b: { idea: boolean }) => +b.idea - +a.idea,
  },
];
