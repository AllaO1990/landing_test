import { EntryEnums } from './entry.enums';
import { EntryHeaderItem } from './entry.types';
import { sortNumber } from '../main.utils';
import { IdeaAuthor, ResponseIdea } from 'types/idea';
import { sortText } from 'utils/sort-text';

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

export const INPUT_DATA = {
  success: true,
  message: 'Success',
  data: {
    total: 1,
    items: [
      {
        id: 326,
        createdAt: '2024-10-16T15:02:00.223773Z',
        updatedAt: '2024-10-16T15:02:00.223773Z',
        positionType: 'short',
        inPosition: false,
        instrument: {
          id: 'ba15183f-d187-49a7-b54d-422fa8c7f4da',
          source: 'tinkoff',
          ticker: 'MSRS',
          name: 'Россети Московский регион',
          type: 'shares',
          exchange: 'MOEX_WEEKEND',
          realExchange: 'moex',
          inSub: true,
          sector: 'utilities',
          currency: 'rub',
        },
        lastPrice: 1.199,
        minPriceIncrement: 0.0005,
        entries: [
          {
            price: 1.199,
            date: '2024-10-16T00:00:00Z',
            quantity: 41701,
            totalPrice: 49999.5,
            depositShare: 5,
          },
        ],
        stop: {
          price: 1.272,
          loss: -3043.3,
          lossPercent: -6.1,
          depositShare: 5.3,
          stopCandleDate: '2024-10-15T00:00:00Z',
        },
        strategy: {
          successProbability: 0.8,
          type: 'consolidation',
        },
        author: 'bot',
        RoundBase: 2000,
        targets: [
          {
            price: 1.1585,
            amount: 16681,
            profit: 671.7,
            profitPercent: 3.4,
            depositShare: 1.9,
            reached: false,
            stopDate: null,
          },
          {
            price: 1.1185,
            amount: 12511,
            profit: 1007.6,
            profitPercent: 6.7,
            depositShare: 1.4,
            reached: false,
            stopDate: null,
          },
          {
            price: 1.0915,
            amount: 12509,
            profit: 1343.3,
            profitPercent: 9,
            depositShare: 1.4,
            reached: false,
            stopDate: null,
          },
        ],
        inPositionQuantity: 41701,
        inPositionPrice: 49999.5,
        inPositionResult: 0,
        inPositionProfitPercent: 0,
        inPositionDepositShare: 5,
        result: {
          profitPercent: 0,
          profitPrice: 0,
        },
      },
    ],
  },
};
