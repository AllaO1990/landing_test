import { StockId, StockInstrument, StockPosition } from './stock';
import { StockStrategy } from './stock-strategy';

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
  entry: {
    price: number;
    quantity: number;
    totalPrice: number;
    depositShare: number;
  };
  target: {
    price: number;
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
    type: StockStrategy;
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
