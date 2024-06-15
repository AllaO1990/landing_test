import { StockId, StockInstrument, StockList } from './stock';

export interface StockListState {
  list: null | StockList;
  active: null | StockId[];
  selected: null | StockInstrument;
}
