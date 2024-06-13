import { ActiveZone } from './chart';
import { StockList, StockListPrice, StockPrice } from './stock';
import { StockList, StockPrice, WithLastPrice } from './stock';

export interface DesktopLkState {
  selected: any | null;
  active: null | StockList;
  price: null | StockPrice<WithLastPrice>;
  defaultPrice: null | StockPrice<WithLastPrice>;
  candles: null | any[];
  consolidationZones: null | ActiveZone[];
}
