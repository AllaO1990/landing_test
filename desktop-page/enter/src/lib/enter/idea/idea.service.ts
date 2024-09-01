import { Injectable } from '@angular/core';
import { IdeaEntry, IdeaStop, IdeaTarget, IdeaTotalTarget } from './idea.types';
import { FormControl } from '@angular/forms';
import { Position } from 'types/position';

@Injectable()
export class IdeaService {
  getIdeaEntries(position: Position): IdeaEntry[] {
    return position.entries.map((item, index: number) => ({
      id: index,
      ...item,
    }));
  }

  getIdeaTargets(position: Position): IdeaTarget[] {
    return position.targets.map((item, index: number) => ({
      id: index,
      date: item.stopDate,
      profit: (item.price - position.entryAveragePrice) * item.amount * position.multiplier,
      ...item,
    }));
  }

  getIdeaStops(position: Position): IdeaStop[] {
    return [
      {
        ...position.stop,
        // position.stop.stopCandleDate,
        date: null,
        id: 0,
        loss: (position.stop.price - position.entryAveragePrice) * position.inPositionQuantity,
        amount: position.inPositionQuantityValue,
        amountPercent: position.inPositionQuantityValue / position.fullPositionQuantity,
      },
    ];
  }

  getTotalTarget(list: IdeaTarget[], totalPrice: number): IdeaTotalTarget {
    const total = list.reduce(
      (acc, item: IdeaTarget) => {
        return {
          profitPercent: acc.profitPercent,
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

  getControlFromList(list: { date: string | null }[]): {
    [key: string]: FormControl<boolean>;
  } {
    return list.reduce((acc: { [key: string]: FormControl<boolean> }, item: { date: string | null }, index: number) => {
      acc[index] = new FormControl<boolean>(
        { value: !!item.date, disabled: true },
        {
          nonNullable: true,
        }
      );

      return acc;
    }, {});
  }
}
