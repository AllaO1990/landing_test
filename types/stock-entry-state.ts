import { Idea } from './idea';

export interface StockEntryState {
  list: null | Idea[];
  // active: null | StockId[];
  selected: null | Idea;
}
