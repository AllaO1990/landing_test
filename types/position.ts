import { StockInstrument, StockPosition } from './stock';

export interface ResponsePositions {
  items: ResponsePosition[];
  total: number;
}

export interface ResponsePosition {
  id: number;
  createdAt: string;
  updatedAt: string;
  positionType: StockPosition;
  inPosition: boolean;
  inPositionQuantity: number;
  inPositionDepositShare: number;
  instrument: StockInstrument;
  lastPrice: number;
  minPriceIncrement: number;
  entry: { price: number; quantity: number; totalPrice: number; depositShare: number };
  targets: { price: number; amount: number; profitPercent: number; depositShare: number }[];
  stop: {
    price: number;
    lossPercent: number;
    depositShare: number;
    stopCandleDate: string;
  };
  strategy: { successProbability: number; type: string };
  author: string;
}

export interface Position extends ResponsePosition {
  priceIncrement: number;
  profit: number;
}
