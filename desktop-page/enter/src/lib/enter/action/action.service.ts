import { Injectable } from '@angular/core';
import { StockPositionEntry, StockPositionTarget } from 'types/position';
import {
  ActionEntryItem,
  ActionOutItem,
  ActionRemainder,
  ActionResult,
  ActionTotalEntry,
  ActionTotalOut,
} from './action.types';

@Injectable()
export class ActionService {
  getListEntry(list: StockPositionEntry[]): ActionEntryItem[] {
    return list.map((item: StockPositionEntry, index: number) => ({
      id: index.toString(),
      ...item,
    }));
  }

  getTotalEntry(list: ActionEntryItem[]): ActionTotalEntry | null {
    if (!list.length) {
      return null;
    }

    const total = list.reduce(
      (acc: ActionTotalEntry, item: ActionEntryItem) => {
        acc.price = 0;
        acc.totalPrice += item.totalPrice;
        acc.depositShare += item.depositShare;
        acc.quantity += item.quantity;

        return acc;
      },
      { price: 0, totalPrice: 0, depositShare: 0, quantity: 0 }
    );

    total.price = total.totalPrice / total.quantity;

    return total;
  }

  getListOut(list: StockPositionTarget[], averagePrice: number, multiplier: number): ActionOutItem[] {
    return list
      .filter((item: StockPositionTarget) => !!item.stopDate)
      .map((item: StockPositionTarget, index: number) => ({
        id: index.toString(),
        ...item,
        date: item.stopDate,
        quantity: item.amount,
        broker: null,
        totalPrice: item.amount * item.price,
        profit: (item.price - averagePrice) * item.amount * multiplier,
      }));
  }

  getTotalOut(list: ActionOutItem[], averagePrice: number, multiplier: number): ActionTotalOut | null {
    if (!list.length) {
      return null;
    }

    const total = list.reduce(
      (acc: ActionTotalOut, item: ActionOutItem) => {
        return {
          price: 0,
          quantity: acc.quantity + item.quantity,
          totalPrice: acc.totalPrice + item.totalPrice,
          profit: acc.profit + item.profit,
          profitPercent: 0,
          depositShare: acc.depositShare + item.depositShare,
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
    total.profitPercent = ((total.price - averagePrice) / total.price) * multiplier;

    return total;
  }

  getRemainder(
    list: StockPositionTarget[],
    averagePrice: number,
    lastPrice: number,
    multiplier: number
  ): ActionRemainder {
    const remainder: ActionRemainder = list.reduce(
      (acc: ActionRemainder, item: StockPositionTarget) => {
        if (item.stopDate) {
          return acc;
        }

        return {
          ...acc,
          quantity: acc.quantity + item.amount,
          totalPrice: acc.totalPrice + item.amount * averagePrice,
          totalProfit: acc.totalProfit + item.amount * lastPrice,
          depositShare: acc.depositShare + item.depositShare,
        };
      },
      {
        price: lastPrice,
        quantity: 0,
        totalPrice: 0,
        totalProfit: 0,
        profit: 0,
        profitPercent: 0,
        depositShare: 0,
        broker: null,
      }
    );

    remainder.profit = (remainder.totalProfit - remainder.totalPrice) * multiplier;
    remainder.profitPercent = remainder.profit / remainder.totalPrice;

    return remainder;
  }

  getResult(
    totalOut: ActionTotalOut | null,
    remainder: ActionRemainder,
    averagePrice: number,
    multiplier: number
  ): ActionResult {
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
      profitPercent: ((price - averagePrice) / averagePrice) * multiplier,
      totalProfit: 0,
      depositShare: remainder.depositShare + totalOut.depositShare,
      broker: remainder.broker,
    };
  }
}
