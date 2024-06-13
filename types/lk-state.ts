import { StockList, StockPrice, WithLastPrice } from './stock';

export interface DesktopLkState {
  selected: any | null;
  active: null | StockList;
  price: null | StockPrice<WithLastPrice>;
  defaultPrice: null | StockPrice<WithLastPrice>;
  candles: null | any[];
}
