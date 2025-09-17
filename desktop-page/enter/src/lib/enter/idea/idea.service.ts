import { Injectable } from '@angular/core';
import { StockPositionIdeaEntry, StockPositionStop, StockPositionTarget } from 'types/position';
import { getNumberPrecision } from 'utils/get-number-precision';

@Injectable()
export class IdeaService {
  private readonly _totalDefaultEntry: StockPositionIdeaEntry = {
    check: false,
    date: null,
    depositShare: null,
    price: 0,
    quantity: 0,
    totalPrice: 0,
    broker: null,
  };

  private readonly _totalDefaultTarget: StockPositionTarget = {
    price: 0,
    amount: 0,
    profit: 0,
    profitPercent: 0,
    depositShare: null,
    totalPrice: 0,
    reached: false,
    stopDate: null,
    broker: null,
  };

  private readonly _totalDefaultStop: StockPositionStop = {
    depositShare: null,
    lossPercent: 0,
    loss: 0,
    price: 0,
    stopCandleDate: null,
    amount: 0,
    amountPercent: 0,
  };

  getTotalEntry(list: StockPositionIdeaEntry[] | null, priceIncrement = 8): StockPositionIdeaEntry {
    if (list === null) {
      return this._totalDefaultEntry;
    }

    return list.reduce(
      (acc: StockPositionIdeaEntry, item: StockPositionIdeaEntry, index: number): StockPositionIdeaEntry => {
        const value = {
          ...acc,
          quantity: acc.quantity + item.quantity,
          depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
          totalPrice: acc.totalPrice + item.price * item.quantity,
        };

        if (list.length - 1 === index) {
          value.price = value.quantity && getNumberPrecision(value.totalPrice / value.quantity, priceIncrement);

          return value;
        }

        return value;
      },
      this._totalDefaultEntry
    );
  }

  getTotalTarget(
    list: StockPositionTarget[] | null,
    total: StockPositionIdeaEntry,
    multiplier: number,
    priceIncrement = 8
  ): StockPositionTarget {
    if (list === null) {
      return this._totalDefaultTarget;
    }

    if (total.price === 0) {
      return this._totalDefaultTarget;
    }

    // const amount = list.reduce((acc: number, item: StockPositionTarget) => (acc += item.stopDate ? 0 : item.amount), 0);
    //
    // if (amount !== total.quantity) {
    //   return this._totalDefaultTarget;
    // }

    return list.reduce((acc: StockPositionTarget, item: StockPositionTarget, index: number): StockPositionTarget => {
      const value: StockPositionTarget = {
        ...acc,
        price: acc.price + item.price * item.amount,
        amount: getNumberPrecision(acc.amount + item.amount, priceIncrement),
        depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
      };

      if (list.length - 1 === index) {
        value.price = getNumberPrecision(value.price / value.amount, priceIncrement);
        value.profitPercent = getNumberPrecision(((value.price - total.price) / total.price) * 100 * multiplier, 2);
        value.profit = getNumberPrecision((value.price - total.price) * value.amount * multiplier, priceIncrement);
      }

      return value;
    }, this._totalDefaultTarget);
  }

  getTotalStop(
    list: StockPositionStop[] | null,
    total: StockPositionIdeaEntry,
    targets: StockPositionTarget[] | null,
    multiplier: number,
    priceIncrement = 8
  ): StockPositionStop {
    if (list === null) {
      return this._totalDefaultStop;
    }

    if (total.price === 0) {
      return this._totalDefaultStop;
    }

    const targetComplete = (targets && targets.filter((item: StockPositionTarget) => item.stopDate)) || [];
    const totalTargetComplete = this.getTotalTarget(
      targetComplete,
      {
        ...total,
        quantity: targetComplete.reduce((acc: number, item: StockPositionTarget) => (acc += item.amount), 0),
      },
      multiplier
    );

    const amount = totalTargetComplete.amount ? total.quantity - totalTargetComplete.amount : total.quantity;

    if (amount === 0) {
      return this._totalDefaultStop;
    }

    return list.reduce((acc: StockPositionStop, item: StockPositionStop, index: number) => {
      const valueAmount = item.amount || amount;
      const value = {
        ...acc,
        amount: (acc.amount || 0) + valueAmount,
        amountPercent: (acc.amountPercent || 0) + (item.amountPercent || 100),
        price: acc.price + item.price * valueAmount,
        depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
      };

      if (list.length - 1 === index) {
        value.loss = getNumberPrecision(
          (value.price - (total.price * value.amount - (totalTargetComplete.profit || 0) * multiplier)) * multiplier,
          priceIncrement
        );
        value.lossPercent = getNumberPrecision(
          (value.loss / (total.price * value.amount - (totalTargetComplete.profit || 0) * multiplier)) * 100,
          2
        );
        value.price = getNumberPrecision(value.price / value.amount, priceIncrement);
      }

      return value;
    }, this._totalDefaultStop);
  }

  getCanAddTarget(list: StockPositionTarget[] | null, quantity: number): boolean {
    if (list === null || list.length === 0) {
      return true;
    }

    const amount = list.reduce((acc: number, item: StockPositionTarget) => (acc += item.stopDate ? 0 : item.amount), 0);

    return amount < quantity;
  }
}
