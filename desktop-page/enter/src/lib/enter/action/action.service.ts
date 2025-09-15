import { Injectable } from '@angular/core';
import {
  StockPositionActionEntry,
  StockPositionActionTarget,
  StockPositionCommission,
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
    size: 0,
    amount: 0,
    profit: null,
    profitPct: null,
    depositShare: null,
    date: null,
    brokerId: null,
  };

  private readonly _defaultTotalCommission: StockPositionCommission = {
    size: 0,
    comment: null,
    date: null,
    profitPct: null,
    profit: null,
    brokerId: null,
    id: null,
  };

  getTotalEntry(list: StockPositionActionEntry[] | null, priceIncrement = 8): StockPositionActionEntry {
    if (list === null) {
      return this._defaultTotalEntry;
    }

    return list.reduce((acc: StockPositionActionEntry, item: StockPositionActionEntry, index: number) => {
      const value: StockPositionActionEntry = {
        ...acc,
        amount: acc.amount + item.amount,
        totalPrice: getNumberPrecision(acc.totalPrice + item.price * item.amount, 2),
        depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
      };

      if (list.length - 1 === index) {
        value.price = getNumberPrecision(value.totalPrice / value.amount, priceIncrement);

        return value;
      }

      return value;
    }, this._defaultTotalEntry);
  }

  getTotalOut(
    list: StockPositionActionTarget[] | null,
    total: StockPositionActionEntry,
    multiplier: number,
    priceIncrement = 8
  ): StockPositionActionTarget {
    if (list === null) {
      return this._defaultTotalOut;
    }

    if (total.price === 0) {
      return this._defaultTotalOut;
    }

    return list.reduce(
      (acc: StockPositionActionTarget, item: StockPositionActionTarget, index: number): StockPositionActionTarget => {
        console.log(item);
        const value: StockPositionActionTarget = {
          ...acc,
          price: acc.price + item.price * item.amount,
          amount: acc.amount + item.amount,
          profit: (acc.profit || 0) + (item.profit || 0),
          depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
        };

        if (list.length - 1 === index) {
          value.totalPrice = value.price;
          value.profit = getNumberPrecision(value.profit || 0, 2);
          value.profitPercent = getNumberPrecision((value.profit / (total.price * value.amount)) * 100, 2);
          value.price = getNumberPrecision(value.price / value.amount, priceIncrement);
        }

        return value;
      },
      this._defaultTotalOut
    );
  }

  getTotalRemainder(
    entry: StockPositionActionEntry,
    target: StockPositionActionTarget,
    lastPrice: number,
    multiplier: number,
    priceIncrement = 8
  ): StockPositionTarget {
    if (entry.price === 0 || lastPrice === 0) {
      return this._defaultTotalRemainder;
    }

    const amount = entry.amount - target.amount;
    const profit = getNumberPrecision((lastPrice * amount - entry.price * amount) * multiplier, priceIncrement);

    return {
      price: lastPrice,
      amount: amount,
      totalPrice: getNumberPrecision(lastPrice * amount, priceIncrement),
      profit: profit,
      profitPercent: profit && getNumberPrecision((profit / (entry.price * amount)) * 100, 2),
      depositShare: null,
      reached: false,
      stopDate: null,
      broker: null,
    };
  }

  getTotalDividend(
    entry: StockPositionActionEntry,
    list: StockPositionDividend[],
    priceIncrement = 8
  ): StockPositionDividend {
    if (list.length === 0) {
      return this._defaultTotalDividend;
    }

    return list.reduce((acc: StockPositionDividend, item: StockPositionDividend, index: number) => {
      const value: StockPositionDividend = {
        ...acc,
        size: acc.size + item.size * item.amount,
        amount: acc.amount + item.amount,
        depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
      };

      if (list.length - 1 === index) {
        value.profit = value.size;
        value.profitPct = getNumberPrecision((value.profit / entry.totalPrice) * 100, 2);
        value.size = getNumberPrecision(value.size / value.amount, priceIncrement);
      }

      return value;
    }, this._defaultTotalDividend);
  }

  getTotalCommission(entry: StockPositionActionEntry, list: StockPositionCommission[]): StockPositionCommission {
    if (list.length === 0) {
      return this._defaultTotalCommission;
    }

    return list.reduce((acc: StockPositionCommission, item: StockPositionCommission, index: number) => {
      const value: StockPositionCommission = {
        ...acc,
        size: acc.size + item.size,
      };

      if (list.length - 1 === index) {
        value.size = getNumberPrecision(value.size, 2);
        value.profitPct = entry.totalPrice && (value.size / entry.totalPrice) * 100;
      }

      return value;
    }, this._defaultTotalCommission);
  }

  getTotalResult(
    entry: StockPositionActionEntry,
    target: StockPositionActionTarget,
    remainder: StockPositionTarget,
    dividend: StockPositionDividend,
    commission: StockPositionCommission,
    lastPrice: number,
    multiplier: number,
    priceIncrement = 8
  ): StockPositionActionTarget {
    if ((entry.price === 0 && dividend.size === 0) || lastPrice === 0) {
      return this._defaultTotalOut;
    }

    const totalPrice = getNumberPrecision(
      target.totalPrice + remainder.totalPrice - commission.size * multiplier,
      priceIncrement
    );
    const profit = getNumberPrecision(
      (totalPrice - entry.totalPrice) * multiplier + (dividend.profit || 0),
      priceIncrement
    );

    return {
      // price: target.price || lastPrice,
      price: getNumberPrecision(totalPrice / entry.amount, 2),
      amount: entry.amount,
      totalPrice: totalPrice,
      profit: profit,
      profitPercent: getNumberPrecision((profit / entry.totalPrice) * 100, 2),
      date: null,
      depositShare: null,
      brokerId: null,
    };
  }
}
