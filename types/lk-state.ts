import {StockList, StockListPrice, StockPrice} from './stock';

export interface DesktopLkState {
  selected: any | null;
  stock: null | StockList;
  active: null | StockList;
  price: null | StockPrice<StockListPrice>;
  defaultPrice: null | StockPrice<StockListPrice>;
}
