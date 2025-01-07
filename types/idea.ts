import { StockId, StockInstrument, StockPosition } from './stock';
import { StockPositionEntry, StockPositionStop, StockPositionStrategy, StockPositionTarget } from './position';

export interface ResponseListIdea {
  items: ResponseIdea[];
  total: number;
}

export interface ResponseIdea {
  id: StockId;
  createdAt: string;
  updatedAt: string;
  inPosition: boolean;
  inPositionQuantity: number;
  inPositionDepositShare: number;
  positionType: StockPosition | string;
  instrument: StockInstrument;
  lastPrice: number;
  minPriceIncrement: number;
  entries: StockPositionEntry[];
  targets: StockPositionTarget[];
  stop: StockPositionStop;
  strategy: StockPositionStrategy;
  author: string;
  inPositionPrice: number;
  inPositionResult: number;
  inPositionProfitPercent: number;
  result: {
    profitPercent: number;
    profitPrice: number;
  };
}

export enum IdeaAuthor {
  BOT = 'bot',
  USER = 'user',
}

export interface Idea extends ResponseIdea {
  priceIncrement: number;
}
