import { EntryEnums } from './entry.enums';
import { EntryHeaderItem } from './entry.types';
import { sortNumber, sortText } from '../main.utils';
import { IdeaAuthor, ResponseIdea } from 'types/idea';

export const ENTRY_CONSTANTS: { [key in EntryEnums]: string } = {
  [EntryEnums.TITLE]: 'Вход',
  [EntryEnums.ADD_IDEA]: '+ Новая идея',
  [EntryEnums.SEARCH]: 'Поиск',
};

export const ENTRY_HEADER: EntryHeaderItem[] = [
  {
    name: 'date',
    label: `Дата <br> Кол.дн.`,
    sorter: (a: ResponseIdea, b: ResponseIdea) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
  },
  {
    name: 'direction',
    label: 'Напр.',
    sorter: (a: ResponseIdea, b: ResponseIdea) => sortText(a.positionType, b.positionType),
  },
  {
    name: 'ticker',
    label: 'Тикер',
    sorter: (a: ResponseIdea, b: ResponseIdea) => sortText(a.instrument.ticker, b.instrument.ticker),
  },
  {
    name: 'cost',
    label: 'Цена',
    sorter: (a: ResponseIdea, b: ResponseIdea) => sortNumber(a.lastPrice, b.lastPrice),
  },
  {
    name: 'enter',
    label: `Цена вх. <br>Кол-во`,
    sorter: (a: ResponseIdea, b: ResponseIdea) => sortNumber(a.entries[0].price, b.entries[0].price),
  },
  {
    name: 'target',
    label: `Цель <br> %/% депо`,
    sorter: (a: ResponseIdea, b: ResponseIdea) => sortNumber(a.targets[0].price, b.targets[0].price),
  },
  {
    name: 'stop',
    label: `Стоп <br> %/% депо`,
    sorter: (a: ResponseIdea, b: ResponseIdea) => sortNumber(a.stop.price, b.stop.price),
  },
  {
    name: 'deposit',
    label: `Стоим. вх.<br>% депо`,
    sorter: (a: ResponseIdea, b: ResponseIdea) => sortNumber(a.entries[0].totalPrice, b.entries[0].totalPrice),
  },
  {
    name: 'luck',
    label: 'Успех %<br> Стратег.',
    sorter: (a: ResponseIdea, b: ResponseIdea) =>
      sortNumber(a.strategy.successProbability, b.strategy.successProbability),
  },
  {
    name: 'idea',
    label: 'Идея',
    sorter: (a: ResponseIdea, b: ResponseIdea) => (b.author === IdeaAuthor.BOT ? 1 : -1),
  },
];
