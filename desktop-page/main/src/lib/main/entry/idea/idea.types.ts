import { StockDirection } from 'types/stock';

export interface IdeaType {
  id: number;
  date: string;
  direction: StockDirection;
  ticker: string;
  cost: number;
  enter: number;
  stop: number;
  luck: number;
  idea: boolean;
}
