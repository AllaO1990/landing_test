import { Position, StockPosition } from './position';
import { StockInstrument } from './stock';

export interface StockIdeaState {
  ideas: null | Position[];
  positions: null | Position[];
  idea: null | StockPosition;
  instrument: null | StockInstrument;
  isLoading: boolean;
}
