import { Position, StockPosition } from './position';

export interface StockIdeaState {
  ideas: null | Position[];
  positions: null | Position[];
  idea: null | StockPosition;
  isLoading: boolean;
}
