export enum StockGroupType {
  'DEFAULT' = 'default',
  'CUSTOM' = 'custom',
}

export enum StockDirection {
  BUY = 'buy',
  SELL = 'sell',
}

export enum StockPosition {
  LONG = 'long',
  SHORT = 'short',
}

export enum StockCurrency {
  USDT = 'usdt',
}

export type StockId = string;

/**
 * Элемент списокв тикеров с полной информацией по эмитенту без цены
 */
export interface StockInstrument {
  id: StockId;
  source: string;
  ticker: string;
  name: string;
  type: string;
  exchange: string;
  realExchange: string;
  inSub: boolean;
  sector: string;
  currency: string;
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
  type: StockGroupType;
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
