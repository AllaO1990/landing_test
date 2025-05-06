import { EventSelected } from './events';

export enum StockGroupType {
  'DEFAULT' = 'default',
  'CUSTOM' = 'custom',
}

export enum StockDirection {
  BUY = 'buy',
  SELL = 'sell',
}

export enum StockPositionDirection {
  LONG = 'long',
  SHORT = 'short',
}

export type StockTransaction = {
  ideaId: StockId;
  instrumentId: StockId;
};

export type StockId = number;

/**
 * Элемент списокв тикеров с полной информацией по эмитенту без цены
 */
export interface StockInstrument {
  id: string;
  source: string;
  ticker: string;
  name: string;
  type: string;
  exchange: string;
  realExchange: string;
  inSub: boolean;
  sector: string;
  currency: string;
  currencySymbol?: string;
  minPriceIncrement: number;
  subscriptionStatus: number;
}

export interface StockListItemPrice {
  price: null | number;
  change: null | number;
  changePercent: null | number;
  increment: null | number;
}

export type StockListItemWithPrice = StockInstrument & StockListItemPrice;

export interface StockInstrumentList {
  id: string;
  name: string;
}

/**
 * Элемент из выпадающего списка для Stock
 */
export interface StockGroup extends StockInstrumentList {
  type: {
    event: EventSelected.STOCK_LIST | EventSelected.WATCH_LIST;
    action: StockGroupType;
  };
}

export type StockGroups = StockGroup[];

export interface StockLinkListInstrument {
  instrumentId: string;
  instrumentsListId: string;
}

export interface Stock {
  total: number;
  items: StockListItems;
}

export type StockLists = StockList[];

export interface StockList {
  id: string;
  name: string;
}

export type StockListItems = StockInstrument[];

export interface StockPrice<T> {
  [key: string]: null | T;
}

export interface WithLastPrice {
  prev: number;
  minPriceIncrement: number;
  last: number;
}

export interface StockParamsConsolidationZones {
  id: string;
  interval: number;
  from: string;
  to: string;
}

export interface StockInstrumentToSubscription {
  authorId: number;
  instrument: StockInstrument;
  subscriptionStatus: string;
}

export type StockGroupList = StockGroup & { items: StockListItems };
