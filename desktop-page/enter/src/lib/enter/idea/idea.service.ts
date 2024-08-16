import { Injectable } from '@angular/core';
import { StockPositionEntry, StockPositionTarget } from 'types/position';
import { IdeaEntry, IdeaTarget, IdeaTotalTarget } from './idea.types';

@Injectable()
export class IdeaService {
  getListEntry(list: StockPositionEntry[]): IdeaEntry[] {
    return list.map((item: StockPositionEntry, index: number) => ({
      id: index.toString(),
      ...item,
      date: item.date,
      checked: !!item.date,
    }));
  }

  getListTarget(
    list: StockPositionTarget[],
    averagePrice: number,
    fullQuantity: number,
    multiplier: number
  ): IdeaTarget[] {
    return list.map((item: StockPositionTarget, index: number) => ({
      id: index.toString(),
      ...item,
      date: item.stopDate,
      profit: (item.price - averagePrice) * item.amount * multiplier,
      amountPercent: item.amount / fullQuantity,
      checked: !!item.stopDate,
    }));
  }

  getTotalTarget(list: IdeaTarget[], totalPrice: number): IdeaTotalTarget {
    const total = list.reduce(
      (acc, item: IdeaTarget) => {
        return {
          profitPercent: 0,
          depositShare: acc.depositShare + item.depositShare,
          amount: acc.amount + item.amount,
          profit: acc.profit + item.profit,
        };
      },
      { profitPercent: 0, profit: 0, depositShare: 0, amount: 0 }
    );

    total.profitPercent = total.profit / totalPrice;

    return total;
  }
}
