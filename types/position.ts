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
  entries: StockPositionEntry[];
  // entry: { price: number; quantity: number; totalPrice: number; depositShare: number };
  targets: StockPositionTarget[];
  stop: StockPositionStop;
  strategy: StockPositionStrategy;
  author: string;
}

export interface StockPositionStrategy {
  successProbability: number;
  type: string;
}

export interface StockPositionStop {
  depositShare: number;
  lossPercent: number;
  price: number;
  stopCandleDate: string | null;
}

export interface StockPositionEntry {
  date: string | null;
  depositShare: number;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface StockPositionTarget {
  price: number;
  amount: number;
  profitPercent: number;
  depositShare: number;
  reached: boolean;
  stopDate: null | string;
}

export interface IPosition extends ResponsePosition {
  priceIncrement: number;
  profit: number;
  entryAveragePrice: number;
  entryAverageCost: number;
}

export class Position implements IPosition {
  private readonly _multiplier: number;
  id: number;
  author: string;
  createdAt: string;
  entries: StockPositionEntry[];
  entryAverageCost: number;
  entryAveragePrice: number;
  inPosition: boolean;
  inPositionDepositShare: number;
  inPositionQuantity: number;
  instrument: StockInstrument;
  lastPrice: number;
  minPriceIncrement: number;
  positionType: StockPosition;
  priceIncrement: number;
  stop: StockPositionStop;
  strategy: StockPositionStrategy;
  targets: StockPositionTarget[];
  updatedAt: string;
  currentTarget: StockPositionTarget | null;
  nextTarget: StockPositionTarget | null;

  get profitPercent(): number {
    return this._getProfitPercent(this.lastPrice);
  }

  get profit(): number {
    return this._getProfit(this.lastPrice);
  }

  constructor(data: ResponsePosition) {
    this._multiplier = data.positionType === 'short' ? -1 : 1;

    this.id = data.id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.positionType = data.positionType;
    this.inPosition = data.inPosition;
    this.inPositionDepositShare = data.inPositionDepositShare;
    this.inPositionQuantity = data.inPositionQuantity * this._multiplier;
    this.instrument = data.instrument;
    this.lastPrice = data.lastPrice;
    this.minPriceIncrement = data.minPriceIncrement;
    this.entries = data.entries;
    this.targets = data.targets;
    this.stop = data.stop;
    this.strategy = data.strategy;
    this.author = data.author;

    this.priceIncrement = getPriceIncrement(data.minPriceIncrement);
    this.entryAveragePrice = this._getAveragePrice(data.entries);
    this.entryAverageCost = this.entryAveragePrice * data.inPositionQuantity;
    this.currentTarget = this._getCurrentTarget(data.targets);
    this.nextTarget = this._getNextTarget(data.targets);
  }

  private _getAveragePrice(data: StockPositionEntry[]): number {
    return data.reduce((acc: number, item: StockPositionEntry) => (acc += item.price), 0) / data.length;
  }

  private _getProfitPercent(lastPrice: number): number {
    return ((lastPrice - this.entryAveragePrice) / lastPrice) * this._multiplier;
  }

  private _getProfit(lastPrice: number): number {
    return (lastPrice * this.inPositionQuantity - this.inPositionQuantity * this.entryAveragePrice) * this._multiplier;
  }

  private _getCurrentTarget(targets: StockPositionTarget[]): StockPositionTarget | null {
    return targets.find((target: StockPositionTarget) => target.stopDate === null) || null;
  }

  private _getNextTarget(targets: StockPositionTarget[]): StockPositionTarget | null {
    const index = targets.findIndex((target: StockPositionTarget) => target.stopDate === null);
    return index === -1 || index === targets.length - 1 ? null : targets[index + 1];
  }
}
