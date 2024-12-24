import { StockId, StockInstrument, StockPosition } from './stock';
import { getPriceIncrement } from '../utils/get-price-increment';

export interface ResponsePositions {
  items: ResponsePosition[];
  total: number;
}

export interface ResponsePosition {
  id: string;
  createdAt: string;
  updatedAt: string;
  inPosition: boolean;
  inPositionQuantity: number;
  inPositionDepositShare: number;
  positionType: StockPosition;
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

export class Position implements ResponsePosition {
  readonly multiplier: number;
  id: StockId;
  author: string;
  createdAt: string;
  entries: StockPositionEntry[];
  inPosition: boolean;
  inPositionDepositShare: number;
  inPositionQuantity: number;
  inPositionQuantityValue: number;
  instrument: StockInstrument;
  minPriceIncrement: number;
  positionType: StockPosition;
  priceIncrement: number;
  stop: StockPositionStop;
  strategy: StockPositionStrategy;
  targets: StockPositionTarget[];
  updatedAt: string;
  currentTarget: StockPositionTarget | null;
  lastPrice: number;

  inPositionPrice: number;
  inPositionProfitPercent: number;
  inPositionResult: number;
  result: { profitPercent: number; profitPrice: number };

  entryAveragePrice: number;
  fullPositionQuantity: number;

  constructor(data: ResponsePosition) {
    this.multiplier = data.positionType === 'short' ? -1 : 1;

    this.id = data.id.toString();
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
    this.lastPrice = data.lastPrice;
    this.inPositionPrice = data.inPositionPrice;
    this.inPositionResult = data.inPositionResult;
    this.inPositionProfitPercent = data.inPositionProfitPercent;
    this.result = data.result;

    // this.fullPositionQuantityValue = this._getFulPositionQuantity(data.targets);
    // this.fullPositionPrice = this._getFullPositionPrice(data.entries);
    this.entryAveragePrice = this._getAveragePrice(data.entries);
    this.fullPositionQuantity = this._getFulPositionQuantity(data.targets);
    this.priceIncrement = getPriceIncrement(data.minPriceIncrement);
    this.currentTarget = this._getCurrentTarget(data.targets);
  }

  private _getAveragePrice(data: StockPositionEntry[]): number {
    const { price, quantity } = data.reduce(
      (acc: { price: number; quantity: number }, item: StockPositionEntry) => {
        acc.price += item.price * item.quantity;
        acc.quantity += item.quantity;

        return acc;
      },
      { price: 0, quantity: 0 }
    );

    return price / quantity;
  }

  private _getCurrentTarget(targets: StockPositionTarget[]): StockPositionTarget | null {
    return targets.find((target: StockPositionTarget) => target.stopDate === null) || null;
  }

  private _getFulPositionQuantity(targets: StockPositionTarget[]): number {
    return targets.reduce((acc: number, item: StockPositionTarget) => (acc += item.amount), 0);
  }

  //
  // private _getProfitPercent(lastPrice: number): number {
  //   return ((lastPrice - this.entryAveragePrice) / lastPrice) * this.multiplier;
  // }
  //
  // private _getProfit(lastPrice: number): number {
  //   return (lastPrice - this.entryAveragePrice) * this.inPositionQuantityValue * this.multiplier;
  // }

  // private _getResultPrice(lastPrice: number): number | null {
  //   if (!this.targets[0].stopDate) {
  //     return null;
  //   }
  //
  //   return (
  //     this.targets.reduce((acc: number, item: StockPositionTarget) => {
  //       if (item.stopDate) {
  //         acc += (item.price - this.entryAveragePrice) * item.amount;
  //       } else {
  //         acc += (lastPrice - this.entryAveragePrice) * item.amount;
  //       }
  //       return acc;
  //     }, 0) * this.multiplier
  //   );
  // }
  //
  // private _getResultPercent(lastPrice: number): number | null {
  //   if (!this._resultPrice) {
  //     return null;
  //   }
  //
  //   return this._resultPrice / (this.entryAveragePrice * this.inPositionQuantityValue);
  // }
  //
  // private _getFullPositionPrice(targets: StockPositionEntry[]): number {
  //   return targets.reduce((acc: number, item: StockPositionEntry) => (acc += item.totalPrice), 0);
  // }
}
