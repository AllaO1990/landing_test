import {StockList, StockListItemPrice, StockPrice} from './stock';

export interface DesktopLkState {
  selected: any | null;
  stock: null | StockList;
  active: null | StockList;
  price: null | StockPrice<StockListItemPrice>;
  defaultPrice: null | StockPrice<StockListItemPrice>;
}
