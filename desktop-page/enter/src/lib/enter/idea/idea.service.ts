import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { StockPositionEntry, StockPositionStop, StockPositionTarget } from 'types/position';

@Injectable()
export class IdeaService {
  private readonly _totalDefaultEntry: StockPositionEntry = {
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

  getTotalEntry(list: StockPositionEntry[] | null): StockPositionEntry {
    if (list === null) {
      return this._totalDefaultEntry;
    }

    return list.reduce((acc: StockPositionEntry, item: StockPositionEntry, index: number): StockPositionEntry => {
      const value = {
        ...acc,
        quantity: acc.quantity + item.quantity,
        depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
        totalPrice: acc.totalPrice + item.price * item.quantity,
      };

      if (list.length - 1 === index) {
        value.price = value.totalPrice / value.quantity;

        return value;
      }

      return value;
    }, this._totalDefaultEntry);
  }

  getTotalTarget(
    list: StockPositionTarget[] | null,
    total: StockPositionEntry,
    multiplier: number
  ): StockPositionTarget {
    if (list === null) {
      return this._totalDefaultTarget;
    }

    return list.reduce((acc: StockPositionTarget, item: StockPositionTarget, index: number): StockPositionTarget => {
      const value: StockPositionTarget = {
        ...acc,
        price: acc.price + item.price * item.amount,
        amount: acc.amount + item.amount,
        depositShare: item.depositShare !== null ? (acc.depositShare || 0) + item.depositShare : acc.depositShare,
      };

      if (list.length - 1 === index) {
        value.profit = (value.price - total.price * total.quantity) * multiplier;
        value.profitPercent = (value.profit / (total.price * total.quantity)) * 100;
        value.price = value.price / value.amount;
      }

      return value;
    }, this._totalDefaultTarget);
  }

  getTotalStop(
    list: StockPositionStop[] | null,
    total: StockPositionEntry,
    targets: StockPositionTarget[] | null,
    multiplier: number
  ): StockPositionStop {
    if (list === null) {
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

    return list.reduce((acc: StockPositionStop, item: StockPositionStop, index: number) => {
      const valueAmount = item.amount || amount;
      const value = {
        ...acc,
        amount: (acc.amount || 0) + valueAmount,
        amountPercent: (acc.amountPercent || 0) + (item.amountPercent || 100),
        price: acc.price + item.price * valueAmount,
      };

      if (list.length - 1 === index) {
        value.loss =
          (value.price - (total.price * value.amount - (totalTargetComplete.profit || 0) * multiplier)) * multiplier;
        value.lossPercent =
          (value.loss / (total.price * value.amount - (totalTargetComplete.profit || 0) * multiplier)) * 100;
        value.price = value.price / value.amount;
      }

      return value;
    }, this._totalDefaultStop);
  }

  getControlFromList(list: { id: number | string; date: string | null }[]): {
    [key: string]: FormControl<boolean>;
  } {
    return list.reduce(
      (
        acc: { [key: string]: FormControl<boolean> },
        item: {
          id: number | string;
          date: string | null;
        }
      ) => {
        acc[item.id] = new FormControl<boolean>(
          { value: !!item.date, disabled: true },
          {
            nonNullable: true,
          }
        );

        return acc;
      },
      {}
    );
  }

  updateListTarget(
    average: { price: number; quantity: number },
    list:
      | {
          price: number;
          quantity: number;
          date: string | null;
        }[]
      | null
  ): StockPositionTarget[] | null {
    console.log(average, list);

    if (list === null) {
      return null;
    }

    return list.map((item: { price: number; quantity: number; date: string | null }) => {
      const profit = (item.price - average.price) * item.quantity;
      const profitPercent = (profit / (average.price * item.quantity)) * 100;

      return {
        price: item.price,
        amount: item.quantity,
        profit: profit,
        profitPercent: profitPercent,
        totalPrice: 0,
        depositShare: null,
        reached: !!item.date,
        stopDate: item.date,
        broker: null,
      };
    });
  }

  updateListStop(
    average: { price: number; quantity: number },
    list:
      | {
          price: number;
          date: string | null;
        }[]
      | null
  ): StockPositionStop[] | null {
    console.log(average, list);

    if (list === null) {
      return null;
    }

    return list.map((item: { price: number; date: string | null }) => {
      const loss = (item.price - average.price) * average.quantity;
      const lossPercent = (loss / (average.price * average.quantity)) * 100;

      return {
        price: item.price,
        loss: loss,
        lossPercent: lossPercent,
        depositShare: null,
        stopCandleDate: item.date,
        amount: average.quantity,
        amountPercent: 100,
      };
    });
  }
}
