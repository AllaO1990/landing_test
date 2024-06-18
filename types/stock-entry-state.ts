import { Idea } from './idea';
import { StockId } from './stock';

export interface StockEntryState {
  list: null | Idea[];
  active: null | StockId[];
  selected: null | Idea;
}
