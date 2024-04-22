import {StockDirection, StockId} from './stock';

export interface Idea {
  id: StockId;
  date: {
    start: string;
    passed: number;
  }
  direction: StockDirection;
  figi: string;
  ticker: string;
  cost: number;
  enter: {
    price: number;
    cost: number;
  },
  target: {
    price: number;
    percentage: number;
  };
  stop: {
    price: number;
    percentage: number;
  };
  deposit: {
    price: number;
    percentage: number;
  };
  luck: {
    value: number;
    percentage: number;
  };
  idea: boolean;
}
