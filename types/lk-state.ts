import { StockPrice, WithLastPrice } from './stock';
import { StockEvent } from './stock-event';

export interface DesktopLkState {
  event: null | StockEvent;
  selected: any | null;
  price: null | StockPrice<WithLastPrice>;
}
