import { StockPositionEntry, StockPositionStop, StockPositionTarget } from 'types/position';

export interface IdeaTotalTarget {
  profitPercent: number;
  profit: number;
  depositShare: number;
  amount: number;
}

export interface IdeaEntry extends StockPositionEntry {
  id: number;
}

export interface IdeaTarget extends StockPositionTarget {
  id: number;
  date: string | null;
  profit: number;
}

export interface IdeaStop extends StockPositionStop {
  id: number;
  date: string | null;
  loss: number;
  amount: number;
  amountPercent: number;
}
