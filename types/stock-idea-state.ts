import { Positions, StockPosition } from './position';
import { StockInstrument, WithLastPrice } from './stock';

export interface StockIdeaState {
  ideas: null | Positions;
  positions: null | Positions;
  idea: null | StockPosition;
  instrument: null | StockInstrument;
  isLoading: boolean;
  lastPrice: null | WithLastPrice;
}
