export enum StockNameType {
  'DEFAULT' = 'default',
  'CUSTOM' = 'custom',
}

export enum StockDirection {
  BUY = 'buy',
  SELL = 'sell',
}

export type StockId = string | number;

/**
 * Элемент списокв тикеров с полной информацией по эмитенту без цены
 */
export interface StockListItem {
  id: string;
  source: string;
  ticker: string;
  name: string;
  type: string;
  exchange: string;
  realExchange: string;
}

/**
 * Элемент из выпадающего списка для Stock
 */
export interface StockName {
  id: StockId;
  name: string;
  type: StockNameType;
}

export interface Stock {
  total: number;
  items: StockList;
}

export type StockList = StockListItem[];

export interface StockPrice<T> {
  [key: string]: null | T;
}

export interface StockListItemPrice {
  prev: number;
  last: number;
}
