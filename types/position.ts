import { StockId, StockInstrument, StockPosition } from './stock';
import { getPriceIncrement } from '../utils/get-price-increment';

export interface ResponsePositions {
  items: ResponsePosition[];
  total: number;
}

export interface ResponsePosition {
  id: string | null;
  createdAt: string;
  updatedAt: string | null;
  inPosition: boolean;
  inPositionQuantity: number;
  inPositionDepositShare: number;
  positionType: StockPosition | null;
  instrument: StockInstrument;
  lastPrice: number;
  minPriceIncrement: number;
  entries: StockPositionEntry[];
  targets: StockPositionTarget[];
  stop: StockPositionStop | null;
  strategy: StockPositionStrategy;
  dividends: StockPositionDividend[];
  author: string;
  inPositionPrice: number;
  inPositionResult: number;
  inPositionProfitPercent: number;
  result: {
    profitPercent: number;
    profitPrice: number;
  };
  subscribed: boolean;
}

export interface StockPositionStrategy {
  successProbability: number;
  type: string;
}

export interface StockPositionStop {
  depositShare: number | null;
  lossPercent: number | null;
  loss: number | null;
  price: number;
  stopCandleDate: string | null;
  amount: number | null;
  amountPercent: number | null;
}

export interface StockPositionEntry {
  date: string | null;
  depositShare: number | null;
  price: number;
  quantity: number;
  totalPrice: number;
  broker: string | null;
}

export interface StockPositionTarget {
  price: number;
  amount: number;
  profit: number | null;
  profitPercent: null | number;
  depositShare: null | number;
  totalPrice: number;
  reached: boolean;
  stopDate: null | string;
  broker: string | null;
}

export interface StockPositionDividend {
  price: number;
  amount: number;
  profit: number | null;
  profitPercent: null | number;
  depositShare: null | number;
  totalPrice: number;
  date: null | string;
  broker: string | null;
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
  positionType: StockPosition | null;
  priceIncrement: number;
  stop: StockPositionStop | null;
  strategy: StockPositionStrategy;
  targets: StockPositionTarget[];
  updatedAt: string | null;
  currentTarget: StockPositionTarget | null;
  lastPrice: number;
  subscribed: boolean = false;
  dividends: StockPositionDividend[];

  inPositionPrice: number;
  inPositionProfitPercent: number;
  inPositionResult: number;
  result: { profitPercent: number; profitPrice: number };

  entryAveragePrice: number;
  fullPositionQuantity: number;

  constructor(data: ResponsePosition) {
    this.multiplier = data.positionType === 'short' ? -1 : 1;

    this.id = (data.id && data.id.toString()) || '';
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
    this.targets = data.targets.map((item) => ({ ...item, totalPrice: item.price * item.amount }));
    this.fullPositionQuantity = this._getFulPositionQuantity(data.targets);
    this.stop = data.stop && {
      ...data.stop,
      amount: data.inPositionQuantity,
      amountPercent: (data.inPositionQuantity / this.fullPositionQuantity) * 100,
    };
    this.strategy = data.strategy;
    this.author = data.author;
    this.lastPrice = data.lastPrice;
    this.inPositionPrice = data.inPositionPrice;
    this.inPositionResult = data.inPositionResult;
    this.inPositionProfitPercent = data.inPositionProfitPercent;
    this.result = data.result;
    this.subscribed = data.subscribed;
    this.dividends = data.dividends || [];

    // this.fullPositionQuantityValue = this._getFulPositionQuantity(data.targets);
    // this.fullPositionPrice = this._getFullPositionPrice(data.entries);
    this.entryAveragePrice = this._getAveragePrice(data.entries);

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
}
