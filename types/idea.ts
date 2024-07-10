import { StockId, StockInstrument, StockPosition } from './stock';
import { StockStrategyEnums } from './stock-strategy';

export interface ResponseListIdea {
  items: ResponseIdea[];
  total: number;
}

export interface ResponseIdea {
  id: StockId;
  createdAt: string;
  positionType: StockPosition;
  instrument: StockInstrument;
  lastPrice: number;
  minPriceIncrement: number;
  entries?: {
    price: number;
    quantity: number;
    totalPrice: number;
    depositShare: number;
  }[];
  entry: {
    price: number;
    quantity: number;
    totalPrice: number;
    depositShare: number;
  };
  targets?: { price: number; amount: number; profitPercent: number; depositShare: number }[];
  target: {
    price: number;
    amount: number;
    profitPercent: number;
    depositShare: number;
  };
  stop: {
    price: number;
    lossPercent: number;
    depositShare: number;
  };
  strategy: {
    successProbability: number;
    type: StockStrategyEnums;
  };
  author: IdeaAuthor;
}

export enum IdeaAuthor {
  BOT = 'bot',
  USER = 'user',
}

export interface Idea extends ResponseIdea {
  priceIncrement: number;
}
