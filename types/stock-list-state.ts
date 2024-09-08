import { StockGroups, StockId, StockInstrument, StockListItems } from './stock';

export interface StockListState {
  groups: null | StockGroups;
  map: null | Map<string, StockListItems>;
  list: null | StockListItems;
  watch: null | StockListItems;
  active: null | StockId[];
  selected: null | StockInstrument;
  now: number;
}
