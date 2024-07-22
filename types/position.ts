import { StockInstrument, StockPosition } from './stock';
import { getPriceIncrement } from '../utils/get-price-increment';

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
  entries: PositionEntry[];
  // entry: { price: number; quantity: number; totalPrice: number; depositShare: number };
  targets: PositionTarget[];
  stop: PositionStop;
  strategy: PositionStrategy;
  author: string;
}

export interface PositionStrategy {
  successProbability: number;
  type: string;
}

export interface PositionStop {
  depositShare: number;
  lossPercent: number;
  price: number;
  stopCandleDate: string | null;
}

export interface PositionEntry {
  date: string | null;
  depositShare: number;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface PositionTarget {
  price: number;
  amount: number;
  profitPercent: number;
  depositShare: number;
  reached: boolean;
  stopDate: null | string;
}

export interface Position extends ResponsePosition {
  priceIncrement: number;
  profit: number;
  profitPercent: number;
  entryAveragePrice: number;
  entryAverageCost: number;
}

export class Position implements Position {
  constructor(data: ResponsePosition) {
    this.id = data.id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.positionType = data.positionType;
    this.inPosition = data.inPosition;
    this.inPositionQuantity = data.inPositionQuantity;
    this.inPositionDepositShare = data.inPositionDepositShare;
    this.instrument = data.instrument;
    this.lastPrice = data.lastPrice;
    this.minPriceIncrement = data.minPriceIncrement;
    this.entries = data.entries;
    this.targets = data.targets;
    this.stop = data.stop;
    this.strategy = data.strategy;
    this.author = data.author;
    this.priceIncrement = getPriceIncrement(data.minPriceIncrement);
    this.entryAveragePrice =
      data.entries.reduce((acc: number, item: PositionEntry) => (acc += item.price), 0) / data.entries.length;
    this.entryAverageCost = this.entryAveragePrice * data.inPositionQuantity;

    this.profitPercent =
      ((data.lastPrice - this.entryAveragePrice) / data.lastPrice) * (data.positionType === 'short' ? -1 : 1);
    this.profit =
      (data.lastPrice * data.inPositionQuantity - data.inPositionQuantity * this.entryAveragePrice) *
      (data.positionType === 'short' ? -1 : 1);
    // this.inPositionQuantity: data.inPositionQuantity * (item.positionType === 'short' ? -1 : 1),
  }
}
