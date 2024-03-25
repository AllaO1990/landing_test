export enum StockNameType {
  'DEFAULT' = 'default',
  'CUSTOM' = 'custom',
}

export type StockId = string | number;

/**
 * Элемент списокв тикеров с полной информацией по эмитенту без цены
 */
export interface StockListItem {
  uid: string;
  figi: string;
  ticker: string;
  class_code: string;
  isin: string;
  currency: string;
  name: string;
  exchange: string;
  country_of_risk: string;
  sector: string;
  logo_base_color: string;
  logo_text_color: string;
}

/**
 * Элемент списка названий для выпадающего списка
 */
export interface StockNameItem {
  id: StockId;
  name: string;
  type: StockNameType;
}
