import { Injectable } from '@angular/core';
import {
  StockPosition,
  StockPositionActionEntry,
  StockPositionActionTarget,
  StockPositionDividend,
  StockPositionTarget,
} from 'types/position';
import { getNumberPrecision } from 'utils/get-number-precision';

@Injectable()
export class ActionService {
  private readonly _defaultTotalEntry: StockPositionActionEntry = {
    date: null,
    price: 0,
    amount: 0,
    depositShare: null,
    totalPrice: 0,
    brokerId: null,
  };

  private readonly _defaultTotalOut: StockPositionActionTarget = {
    price: 0,
    amount: 0,
    profit: 0,
    date: null,
    profitPercent: 0,
    totalPrice: 0,
    depositShare: null,
    brokerId: null,
  };

  private readonly _defaultTotalRemainder: StockPositionTarget = {
    price: 0,
    amount: 0,
    profit: 0,
    profitPercent: 0,
    totalPrice: 0,
    depositShare: null,
    reached: false,
    stopDate: null,
    broker: null,
  };

  private readonly _defaultTotalDividend: StockPositionDividend = {
    price: 0,
    amount: 0,
    profit: null,
    profitPercent: null,
    totalPrice: 0,
    depositShare: null,
    date: null,
    broker: null,
  };

  getTotalEntry(list: StockPositionActionEntry[] | null): StockPositionActionEntry {
    if (list === null) {
      return this._defaultTotalEntry;
    }

    return list.reduce((acc: StockPositionActionEntry, item: StockPositionActionEntry, index: number) => {
      const value: StockPositionActionEntry = {
        ...acc,
        amount: acc.amount + item.amount,
        totalPrice: acc.totalPrice + item.price * item.amount,
        depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
      };

      if (list.length - 1 === index) {
        value.price = value.totalPrice / value.amount;

        return value;
      }

      return value;
    }, this._defaultTotalEntry);
  }

  getTotalOut(
    list: StockPositionActionTarget[] | null,
    total: StockPositionActionEntry,
    multiplier: number
  ): StockPositionActionTarget {
    if (list === null) {
      return this._defaultTotalOut;
    }

    if (total.price === 0) {
      return this._defaultTotalOut;
    }

    return list.reduce(
      (acc: StockPositionActionTarget, item: StockPositionActionTarget, index: number): StockPositionActionTarget => {
        const value: StockPositionActionTarget = {
          ...acc,
          price: acc.price + item.price * item.amount,
          amount: acc.amount + item.amount,
          depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
        };

        if (list.length - 1 === index) {
          value.totalPrice = value.price;
          value.profit = (value.price - total.price * value.amount) * multiplier;
          value.profitPercent = (value.profit / (total.price * value.amount)) * 100;
          value.price = value.price / value.amount;
        }

        return value;
      },
      this._defaultTotalOut
    );
  }

  getTotalRemainder(
    entry: StockPositionActionEntry,
    target: StockPositionActionTarget,
    idea: StockPosition
  ): StockPositionTarget {
    if (entry.price === 0 || target.price === 0 || idea.idea.lastPrice === 0) {
      return this._defaultTotalRemainder;
    }

    const amount = entry.amount - target.amount;
    const profit = idea.idea.lastPrice * amount - entry.price * amount;

    return {
      price: idea.idea.lastPrice,
      amount: amount,
      totalPrice: idea.idea.lastPrice * amount,
      profit: profit,
      profitPercent: getNumberPrecision((profit / entry.price) * amount * 100, 2),
      depositShare: null,
      reached: false,
      stopDate: null,
      broker: null,
    };
  }

  getTotalDividend(): StockPositionDividend {
    return this._defaultTotalDividend;
  }

  getTotalResult(
    entry: StockPositionActionEntry,
    target: StockPositionActionTarget,
    remainder: StockPositionTarget,
    idea: StockPosition
  ): StockPositionActionTarget {
    if (entry.price === 0 || target.price === 0 || idea.idea.lastPrice === 0) {
      return this._defaultTotalOut;
    }

    const totalPrice = target.totalPrice + remainder.totalPrice;

    return {
      price: target.price,
      amount: entry.amount,
      totalPrice: totalPrice,
      profit: totalPrice - entry.totalPrice,
      profitPercent: getNumberPrecision(((totalPrice - entry.totalPrice) / entry.totalPrice) * 100, 2),
      date: null,
      depositShare: null,
      brokerId: null,
    };
  }
}
