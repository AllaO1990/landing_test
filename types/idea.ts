import { StockId, StockInstrument, StockPosition } from './stock';
import { StockPositionEntry, StockPositionStop, StockPositionTarget } from './position';

export interface ResponseListIdea {
  items: ResponseIdea[];
  total: number;
}

export interface ResponseIdea {
  updatedAt: string;
  inPosition: boolean;
  inPositionQuantity: number;
  inPositionDepositShare: number;
  id: StockId;
  createdAt: string;
  positionType: StockPosition | string;
  instrument: StockInstrument;
  lastPrice: number;
  minPriceIncrement: number;
  entries: StockPositionEntry[];
  targets: StockPositionTarget[];
  stop: StockPositionStop;
  strategy: {
    successProbability: number;
    type: string;
  };
  author: string;
}

export enum IdeaAuthor {
  BOT = 'bot',
  USER = 'user',
}

export interface Idea extends ResponseIdea {
  priceIncrement: number;
}
