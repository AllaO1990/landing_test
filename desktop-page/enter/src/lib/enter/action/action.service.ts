import { Injectable } from '@angular/core';
import {
  Position,
  StockPositionActionEntry,
  StockPositionActionTarget,
  StockPositionDividend,
  StockPositionIdeaEntry,
  StockPositionTarget,
} from 'types/position';
import {
  ActionEntry,
  ActionOut,
  ActionRemainder,
  ActionResult,
  ActionTotalEntry,
  ActionTotalOut,
} from './action.types';

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
    profit: 0,
    profitPercent: 0,
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

  getTotalRemainder(): StockPositionTarget {
    return this._defaultTotalRemainder;
  }

  getTotalDividend(): StockPositionDividend {
    return this._defaultTotalDividend;
  }

  getTotalResult(): StockPositionActionTarget {
    return this._defaultTotalOut;
  }

  getActionEntry(position: Position): ActionEntry[] {
    return position.entries.map((item: StockPositionIdeaEntry, index: number) => ({
      id: index.toString(),
      ...item,
    }));
  }

  getActionTotalEntry(list: ActionEntry[]): ActionTotalEntry | null {
    if (!list.length) {
      return null;
    }

    const total = list.reduce(
      (acc: ActionTotalEntry, item: ActionEntry) => {
        acc.price = 0;
        acc.totalPrice += item.totalPrice;
        acc.depositShare += item.depositShare || 0;
        acc.quantity += item.quantity;

        return acc;
      },
      { price: 0, totalPrice: 0, depositShare: 0, quantity: 0 }
    );

    total.price = total.totalPrice / total.quantity;

    return total;
  }

  getActionOut(position: Position): ActionOut[] {
    return position.targets
      .filter((item: StockPositionTarget) => !!item.stopDate)
      .map((item: StockPositionTarget, index: number) => ({
        id: index.toString(),
        ...item,
        date: item.stopDate,
        quantity: item.amount,
        broker: null,
        totalPrice: item.amount * item.price,
        profit: (item.price - position.entryAveragePrice) * item.amount * position.multiplier,
      }));
  }

  getActionTotalOut(list: ActionOut[], averagePrice: number, multiplier: number): ActionTotalOut | null {
    if (!list.length) {
      return null;
    }

    const total = list.reduce(
      (acc: ActionTotalOut, item: ActionOut) => {
        return {
          price: 0,
          quantity: acc.quantity + item.quantity,
          totalPrice: acc.totalPrice + item.totalPrice,
          profit: acc.profit + item.profit,
          profitPercent: 0,
          depositShare: acc.depositShare + (item.depositShare || 0),
        };
      },
      {
        price: 0,
        quantity: 0,
        totalPrice: 0,
        profit: 0,
        profitPercent: 0,
        depositShare: 0,
      }
    );

    total.price = total.totalPrice / total.quantity;
    total.profitPercent = ((total.price - averagePrice) / total.price) * multiplier * 100;

    return total;
  }

  getRemainder(position: Position): ActionRemainder {
    const remainder: ActionRemainder = position.targets.reduce(
      (acc: ActionRemainder, item: StockPositionTarget) => {
        if (item.stopDate) {
          return acc;
        }

        return {
          ...acc,
          quantity: acc.quantity + item.amount,
          totalPrice: acc.totalPrice + item.amount * position.entryAveragePrice,
          totalProfit: acc.totalProfit + item.amount * position.lastPrice,
          depositShare: acc.depositShare + (item.depositShare || 0),
        };
      },
      {
        price: position.lastPrice,
        quantity: 0,
        totalPrice: 0,
        totalProfit: 0,
        profit: 0,
        profitPercent: 0,
        depositShare: 0,
        broker: null,
      }
    );

    remainder.profit = (remainder.totalProfit - remainder.totalPrice) * position.multiplier;
    remainder.profitPercent = (remainder.profit / remainder.totalPrice) * 100;

    return remainder;
  }

  getResult(totalOut: ActionTotalOut | null, remainder: ActionRemainder, position: Position): ActionResult {
    if (!totalOut) {
      return remainder;
    }

    const price =
      (remainder.price * remainder.quantity + totalOut.price * totalOut.quantity) /
      (remainder.quantity + totalOut.quantity);

    return {
      price,
      totalPrice: (remainder.quantity + totalOut.quantity) * price,
      quantity: remainder.quantity + totalOut.quantity,
      profit: remainder.profit + totalOut.profit,
      profitPercent: ((price - position.entryAveragePrice) / position.entryAveragePrice) * position.multiplier * 100,
      totalProfit: 0,
      depositShare: remainder.depositShare + totalOut.depositShare,
      broker: remainder.broker,
    };
  }
}
