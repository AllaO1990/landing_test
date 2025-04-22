import { StockId, StockInstrument, StockPositionDirection } from './stock';
import { getPriceIncrement } from '../utils/get-price-increment';
import { AccountBroker } from './account';

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
  positionType: StockPositionDirection | null;
  instrument: StockInstrument;
  lastPrice: number;
  inPositionTotalPrice: number;
  inPositionAccountingPrice: number;
  minPriceIncrement: number;
  entries: StockPositionIdeaEntry[];
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

export interface StockPosition {
  actions: {
    entries: StockPositionActionEntry[];
    outs: StockPositionActionTarget[];
    position: {
      amount: number;
      price: number;
      profit: number;
      profitPercent: number;
      totalPrice: number;
    } | null;
  };
  comissions: StockPositionCommission[];
  dividends: {
    amount: number;
    brokerId: number;
    date: string;
    size: number;
  }[];
  idea: {
    author: string;
    createdAt: string | null;
    comment: string;
    expirationDate: string | null;
    entries: StockPositionIdeaEntry[];
    id: number | null;
    inPosition: boolean;
    inPositionDepositShare: number;
    inPositionPrice: number;
    inPositionProfitPercent: number;
    inPositionQuantity: number;
    inPositionResult: number;
    instrument: StockInstrument;
    lastPrice: number;
    portfolioId: null | number;
    minPriceIncrement: number;
    positionType: string;
    result: {
      profitPercent: number;
      profitPrice: number;
    };
    stop: null | StockPositionStop;
    strategy: null | StockPositionStrategy;
    subscribed: boolean;
    parentId: number | null;
    targets: StockPositionTarget[];
    updatedAt: null | string;
  };
}

export interface StockPositionStrategy {
  successProbability: number;
  type: string;
  name: string;
  id: number;
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

export interface StockPositionIdeaEntry {
  check: boolean;
  date: string | null;
  depositShare: number | null;
  price: number;
  quantity: number;
  totalPrice: number;
  broker: AccountBroker | null;
}

export interface StockPositionActionEntry {
  date: string | null;
  price: number;
  amount: number;
  brokerId: number | null;
  depositShare: number | null;
  totalPrice: number;
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
  broker: number | null;
}

export interface StockPositionActionTarget {
  price: number;
  amount: number;
  profit: number | null;
  profitPercent: null | number;
  totalPrice: number;
  brokerId: number | null;
  depositShare: null | number;
  date: string | null;
}

export interface StockPositionDividend {
  size: number;
  amount: number;
  profit: number | null;
  profitPct: null | number;
  depositShare: null | number;
  date: null | string;
  brokerId: number | null;
}

export interface StockPositionCommission {
  size: number;
  brokerId: null | number;
  comment: null | string;
  date: null | string;
  profit: null | number;
  profitPct: null | number;
  id: number | null;
}

export class Position implements ResponsePosition {
  readonly multiplier: number;
  id: StockId;
  author: string;
  createdAt: string;
  entries: StockPositionIdeaEntry[];
  inPosition: boolean;
  inPositionDepositShare: number;
  inPositionQuantity: number;
  inPositionQuantityValue: number;
  instrument: StockInstrument;
  minPriceIncrement: number;
  positionType: StockPositionDirection | null;
  priceIncrement: number;
  inPositionAccountingPrice: number;
  inPositionTotalPrice: number;
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
  priceToTarget: number | null = null;
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
    this.inPositionAccountingPrice = data.inPositionAccountingPrice;
    this.entries = data.entries;
    this.targets = data.targets.map((item) => ({ ...item, totalPrice: item.price * item.amount }));
    this.fullPositionQuantity = this._getFulPositionQuantity(data.targets);
    this.stop = data.stop && {
      ...data.stop,
      amount: data.inPositionQuantity,
      amountPercent: (data.inPositionQuantity / this.fullPositionQuantity) * 100,
    };
    this.inPositionTotalPrice = data.inPositionTotalPrice;
    this.strategy = data.strategy;
    this.author = data.author;
    this.lastPrice = data.lastPrice;
    this.inPositionPrice = data.inPositionPrice;
    this.inPositionResult = data.inPositionResult;
    this.inPositionProfitPercent = data.inPositionProfitPercent;
    this.result = data.result;
    this.subscribed = data.subscribed;
    this.dividends = data.dividends || [];

    this.priceToTarget = this._getPriceToTarget(data.lastPrice, data.entries);

    // this.fullPositionQuantityValue = this._getFulPositionQuantity(data.targets);
    // this.fullPositionPrice = this._getFullPositionPrice(data.entries);
    this.entryAveragePrice = this._getAveragePrice(data.entries);

    this.priceIncrement = getPriceIncrement(data.minPriceIncrement);
    this.currentTarget = this._getCurrentTarget(data.targets);
  }

  private _getAveragePrice(data: StockPositionIdeaEntry[]): number {
    const { price, quantity } = data.reduce(
      (acc: { price: number; quantity: number }, item: StockPositionIdeaEntry) => {
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

  private _getPriceToTarget(price: number, entries: StockPositionIdeaEntry[]): number | null {
    if (entries.length === 0 || entries[0] === null) {
      return null;
    }

    return Math.abs(((price - entries[0].price) / entries[0].price) * 100);
  }
}
