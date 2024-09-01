import { StockPositionEntry, StockPositionTarget } from 'types/position';

export interface ActionEntry extends StockPositionEntry {
  id: string;
}

export interface ActionTotalEntry {
  price: number;
  quantity: number;
  totalPrice: number;
  depositShare: number;
}

export interface ActionOut extends StockPositionTarget {
  id: string;
  date: string | null;
  quantity: number;
  totalPrice: number;
  profit: number;
  broker: string | null;
}

export interface ActionTotalOut {
  price: number;
  quantity: number;
  totalPrice: number;
  profit: number;
  profitPercent: number;
  depositShare: number;
}

export interface ActionRemainder {
  price: number;
  totalPrice: number;
  quantity: number;
  profit: number;
  profitPercent: number;
  totalProfit: number;
  depositShare: number;
  broker: string | null;
}

export interface ActionResult {
  price: number;
  totalPrice: number;
  quantity: number;
  profit: number;
  profitPercent: number;
  totalProfit: number;
  depositShare: number;
  broker: string | null;
}
