import { Positions, StockPosition } from './position';
import { StockInstrument } from './stock';

export interface StockIdeaState {
  ideas: null | Positions;
  positions: null | Positions;
  idea: null | StockPosition;
  instrument: null | StockInstrument;
  isLoading: boolean;
}
