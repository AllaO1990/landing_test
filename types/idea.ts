import { StockId, StockInstrument, StockPosition } from './stock';

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
  entries: {
    price: number;
    quantity: number;
    totalPrice: number;
    depositShare: number;
    date: string | null;
  }[];
  targets: {
    price: number;
    amount: number;
    profitPercent: number;
    depositShare: number;
    reached: boolean;
    stopDate: null | string;
  }[];
  stop: {
    price: number;
    lossPercent: number;
    depositShare: number;
    stopCandleDate: string;
  };
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
