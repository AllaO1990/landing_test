import { EntryEnums } from './entry.enums';
import { EntryHeaderItem } from './entry.types';
import { sortNumber } from 'utils/sort-number';
import { IdeaAuthor, ResponseIdea } from 'types/idea';
import { sortText } from 'utils/sort-text';

export const ENTRY_CONSTANTS: { [key in EntryEnums]: string } = {
  [EntryEnums.TITLE]: 'Идеи',
  [EntryEnums.ADD_IDEA]: 'Новая идея',
  [EntryEnums.SEARCH]: 'Поиск',
  [EntryEnums.TYPE]: 'Актив',
  [EntryEnums.STRATEGY]: 'Стратегия',
  [EntryEnums.CURRENCY]: 'Валюта',
  [EntryEnums.FILTER]: 'Фильтр',
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
    sorter: (a: ResponseIdea, b: ResponseIdea) => sortNumber(a.stop.price || 0, b.stop.price || 0),
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
        id: 568,
        createdAt: '2024-12-02T15:05:01.101516Z',
        updatedAt: '2024-12-02T15:05:01.101516Z',
        positionType: 'short',
        inPosition: false,
        instrument: {
          id: '681dedcf-6e33-4fe9-a640-9962627ae5b2',
          source: 'tinkoff',
          ticker: 'TRNFP',
          name: 'Транснефть - привилегированные акции',
          type: 'shares',
          exchange: 'MOEX_EVENING_WEEKEND',
          realExchange: 'moex',
          inSub: true,
          sector: 'energy',
          currency: 'rub',
        },
        lastPrice: 1003.5,
        minPriceIncrement: 0.5,
        entries: [
          {
            price: 1004,
            date: null,
            quantity: 49,
            totalPrice: 49196,
            depositShare: 4.9,
          },
        ],
        stop: {
          price: 1100.5,
          loss: -4722.5,
          lossPercent: -9.6,
          depositShare: 5.4,
          stopCandleDate: '2024-11-29T00:00:00Z',
        },
        strategy: {
          successProbability: 0.8,
          type: 'consolidation',
          name: 'Консолидация',
        },
        author: 'bot',
        isActive: false,
        targets: [
          {
            price: 915,
            amount: 20,
            profit: 1775,
            profitPercent: 8.8,
            depositShare: 1.8,
            reached: false,
            stopDate: null,
          },
          {
            price: 826.5,
            amount: 15,
            profit: 2662.6,
            profitPercent: 17.7,
            depositShare: 1.2,
            reached: false,
            stopDate: null,
          },
          {
            price: 767.5,
            amount: 14,
            profit: 3313.4,
            profitPercent: 23.6,
            depositShare: 1.1,
            reached: false,
            stopDate: null,
          },
        ],
        inPositionQuantity: 49,
        inPositionPrice: 49171.5,
        inPositionResult: 24.5,
        inPositionProfitPercent: 0,
        inPositionDepositShare: 4.9,
        result: {
          profitPercent: 0,
          profitPrice: 24.5,
        },
      },
    ],
  },
};
