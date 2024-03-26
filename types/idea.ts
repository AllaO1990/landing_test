import { StockDirection, StockId } from './stock';

export interface Idea {
  id: StockId;
  date: string;
  direction: StockDirection;
  figi: string;
  ticker: string;
  cost: number;
  enter: number;
  stop: number;
  deposit: number;
  luck: number;
  idea: boolean;
}
