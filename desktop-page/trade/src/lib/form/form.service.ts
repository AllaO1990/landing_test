import { Injectable } from '@angular/core';
import { StockPosition } from 'types/position';
import { TradeOperation, TradeOperations } from '../common/api.types';
import { sortNumber } from 'utils/sort-number';

@Injectable()
export class TradeFormService {
  updateIdea(position: StockPosition, entries: TradeOperations, outs: TradeOperations) {
    return {
      actions: {
        entries: [
          ...position.actions.entries.map((item: any) => ({
            amount: item.amount,
            brokerId: item.brokerId,
            date: item.date,
            price: item.price,
          })),
          ...entries
            .map((item) => ({
              amount: item.quantity,
              date: item.date,
              brokerId: 1,
              price: item.price.value,
            }))
            .sort((a: { date: string }, b: { date: string }) =>
              sortNumber(new Date(b.date).valueOf(), new Date(a.date).valueOf())
            ),
        ],
        outs: [
          ...position.actions.outs.map((item: any) => ({
            amount: item.amount,
            brokerId: item.brokerId,
            date: item.date,
            price: item.price,
          })),
          ...outs
            .map((item) => ({
              amount: item.quantity,
              date: item.date as string,
              brokerId: 1,
              price: item.price.value,
            }))
            .sort((a: { date: string }, b: { date: string }) =>
              sortNumber(new Date(b.date).valueOf(), new Date(a.date).valueOf())
            ),
        ],
      },
      dividends: position.dividends.map((item: any) => ({
        amount: item.amount,
        brokerId: item.brokerId,
        date: item.date,
        size: item.size,
      })),
      comissions: [
        ...position.comissions.map((item: any) => ({
          brokerId: item.brokerId,
          comment: item.comment,
          date: item.date,
          size: item.size,
        })),
        ...[...entries, ...outs].map((item: TradeOperation) => ({
          brokerId: 1,
          comment: item.description,
          date: item.date,
          size: Math.abs(item.comission.value),
        })),
      ],
      idea: {
        goals: position.idea.targets.map((item: any) => ({
          amount: item.amount,
          goal: item.price,
        })),
        instrumentId: position.idea.instrument.id,
        parentId: position.idea.parentId,
        portfolioId: position.idea.portfolioId,
        positionType: position.idea.positionType,
        strategyId: position.idea.strategy!.id,
        amount: position.idea.entries.reduce((acc, item) => (acc += item.quantity), 0),
        entry: position.idea.entries[0] ? position.idea.entries[0].price : null,
        stop: position.idea.stop ? position.idea.stop.price : null,
        watch: true,
      },
    };
  }
}
