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
}

export class Position implements IPosition {
  private _lastPrice = -1;
  private _profit = 0;
  private _profitPercent = 0;
  private _resultPrice: number | null = null;
  private _resultPercent: number | null = null;
  readonly multiplier: number;
  id: number;
  author: string;
  createdAt: string;
  entries: StockPositionEntry[];
  entryAveragePrice: number;
  inPosition: boolean;
  inPositionDepositShare: number;
  inPositionQuantity: number;
  inPositionQuantityValue: number;
  fullPositionQuantityValue: number;
  fullPositionPrice: number;
  instrument: StockInstrument;
  minPriceIncrement: number;
  positionType: StockPosition;
  priceIncrement: number;
  stop: StockPositionStop;
  strategy: StockPositionStrategy;
  targets: StockPositionTarget[];
  updatedAt: string;
  currentTarget: StockPositionTarget | null;

  get profitPercent(): number {
    return this._profitPercent;
  }

  get profit(): number {
    return this._profit;
  }

  get resultPercent(): number | null {
    return this._resultPercent;
  }

  get resultPrice(): number | null {
    return this._resultPrice;
  }

  set lastPrice(value: number) {
    if (value !== this._lastPrice) {
      this._profit = this._getProfit(value);
      this._profitPercent = this._getProfitPercent(value);
      this._resultPrice = this._getResultPrice(value);
      this._resultPercent = this._getResultPercent(value);
    }

    this._lastPrice = value;
  }

  get lastPrice() {
    return this._lastPrice;
  }

  constructor(data: ResponsePosition) {
    this.multiplier = data.positionType === 'short' ? -1 : 1;

    this.id = data.id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.positionType = data.positionType;
    this.inPosition = data.inPosition;
    this.inPositionDepositShare = data.inPositionDepositShare;
    this.inPositionQuantity = data.inPositionQuantity * this.multiplier;
    this.inPositionQuantityValue = data.inPositionQuantity;
    this.instrument = data.instrument;
    this.minPriceIncrement = data.minPriceIncrement;
    this.entries = data.entries;
    this.targets = data.targets;
    this.stop = data.stop;
    this.strategy = data.strategy;
    this.author = data.author;

    this.fullPositionQuantityValue = this._getFulPositionQuantity(data.targets);
    this.fullPositionPrice = this._getFullPositionPrice(data.entries);
    this.priceIncrement = getPriceIncrement(data.minPriceIncrement);
    this.entryAveragePrice = this._getAveragePrice(data.entries);
    this.currentTarget = this._getCurrentTarget(data.targets);
    this.lastPrice = data.lastPrice;
  }

  private _getAveragePrice(data: StockPositionEntry[]): number {
    return data.reduce((acc: number, item: StockPositionEntry) => (acc += item.price), 0) / data.length;
  }

  private _getProfitPercent(lastPrice: number): number {
    return ((lastPrice - this.entryAveragePrice) / lastPrice) * this.multiplier;
  }

  private _getProfit(lastPrice: number): number {
    return (lastPrice - this.entryAveragePrice) * this.inPositionQuantityValue * this.multiplier;
  }

  private _getCurrentTarget(targets: StockPositionTarget[]): StockPositionTarget | null {
    return targets.find((target: StockPositionTarget) => target.stopDate === null) || null;
  }

  private _getResultPrice(lastPrice: number): number | null {
    if (!this.targets[0].stopDate) {
      return null;
    }

    return (
      this.targets.reduce((acc: number, item: StockPositionTarget) => {
        if (item.stopDate) {
          acc += (item.price - this.entryAveragePrice) * item.amount;
        } else {
          acc += (lastPrice - this.entryAveragePrice) * item.amount;
        }
        return acc;
      }, 0) * this.multiplier
    );
  }

  private _getResultPercent(lastPrice: number): number | null {
    if (!this._resultPrice) {
      return null;
    }

    return this._resultPrice / (this.entryAveragePrice * this.inPositionQuantityValue);
  }

  private _getFulPositionQuantity(targets: StockPositionTarget[]): number {
    return targets.reduce((acc: number, item: StockPositionTarget) => (acc += item.amount), 0);
  }

  private _getFullPositionPrice(targets: StockPositionEntry[]): number {
    return targets.reduce((acc: number, item: StockPositionEntry) => (acc += item.totalPrice), 0);
  }
}
