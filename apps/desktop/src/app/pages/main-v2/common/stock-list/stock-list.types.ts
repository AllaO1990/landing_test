export enum StockNameType {
  'DEFAULT' = 'default',
  'CUSTOM' = 'custom'
}

export type StockId = string | number;

/**
 * Элемент списка названий для выпадающего списка
 */
export interface StockNameItem {
  id: StockId;
  name: string;
  type: StockNameType;
}

/**
 * "Элемент списокв тикеров с полной информацией по эмитенту без цены
 */
export interface StockListItem {
  id: StockId;
  name: string;
}

/**
 * Элемент списка цен по ID тикера
 */
export interface StockCosListItem {
  id: StockId;
  cost: number;
}

export interface StockList {
  id: StockId;
  list: StockListItem[];
}
