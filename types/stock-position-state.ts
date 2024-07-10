import { StockId } from './stock';
import { Position } from './position';

export interface StockPositionState {
  list: null | Position[];
  active: null | StockId[];
  selected: null | Position;
}
