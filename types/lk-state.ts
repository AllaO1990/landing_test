import { StockList } from './stock';

export interface DesktopLkState {
  selected: any | null;
  stock: null | StockList;
  active: null | StockList;
}
