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

export type StockId = string | number;

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
  currency: StockCurrency;
}

export interface StockListItemPrice {
  price: null | number;
  change: null | number;
  changePercent: null | number;
  increment: null | number;
}

export type StockListItemWithPrice = StockInstrument & StockListItemPrice;

/**
 * Элемент из выпадающего списка для Stock
 */
export interface StockGroup {
  id: StockId;
  name: string;
  type: StockGroupType;
}

export interface StockUserGroup {
  id: string;
  name: string;
  list: string[];
}

export interface Stock {
  total: number;
  items: StockList;
}

export type StockList = StockInstrument[];

export interface StockPrice<T> {
  [key: string]: null | T;
}

export interface WithLastPrice {
  prev: number;
  minPriceIncrement: number;
  last: number;
}
