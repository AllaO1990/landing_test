import { Injectable } from '@angular/core';
import { StockPosition } from 'types/position';

@Injectable()
export class TradeFormService {
  updateIdeaEntries(
    position: StockPosition,
    orders: {
      amount: number;
      date: string;
      brokerId: number;
      price: number;
    }[]
  ): any {
    return {
      actions: {
        entries: [
          ...position.actions.entries.map((item: any) => ({
            amount: item.amount,
            brokerId: item.brokerId,
            date: item.date,
            price: item.price,
          })),
          ...orders,
        ],
        outs: position.actions.outs.map((item: any) => ({
          amount: item.amount,
          brokerId: item.brokerId,
          date: item.date,
          price: item.price,
        })),
      },
      dividends: position.dividends.map((item: any) => ({
        amount: item.amount,
        brokerId: item.brokerId,
        date: item.date,
        size: item.size,
      })),
      comissions: position.comissions.map((item: any) => ({
        brokerId: item.brokerId,
        comment: item.comment,
        date: item.date,
        size: item.size,
      })),
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

  updateIdeaOuts(
    position: StockPosition,
    orders: {
      amount: number;
      date: string;
      brokerId: number;
      price: number;
    }[]
  ): any {
    return {
      actions: {
        entries: position.actions.entries.map((item: any) => ({
          amount: item.amount,
          brokerId: item.brokerId,
          date: item.date,
          price: item.price,
        })),
        outs: [
          ...position.actions.outs.map((item: any) => ({
            amount: item.amount,
            brokerId: item.brokerId,
            date: item.date,
            price: item.price,
          })),
          ...orders,
        ],
      },
      dividends: position.dividends.map((item: any) => ({
        amount: item.amount,
        brokerId: item.brokerId,
        date: item.date,
        size: item.size,
      })),
      comissions: position.comissions.map((item: any) => ({
        brokerId: item.brokerId,
        comment: item.comment,
        date: item.date,
        size: item.size,
      })),
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

  updateIdea(
    position: StockPosition,
    entries: {
      amount: number;
      date: string;
      brokerId: number;
      price: number;
    }[],
    outs: {
      amount: number;
      date: string;
      brokerId: number;
      price: number;
    }[]
  ) {
    return {
      actions: {
        entries: [
          ...position.actions.entries.map((item: any) => ({
            amount: item.amount,
            brokerId: item.brokerId,
            date: item.date,
            price: item.price,
          })),
          ...entries,
        ],
        outs: [
          ...position.actions.outs.map((item: any) => ({
            amount: item.amount,
            brokerId: item.brokerId,
            date: item.date,
            price: item.price,
          })),
          ...outs,
        ],
      },
      dividends: position.dividends.map((item: any) => ({
        amount: item.amount,
        brokerId: item.brokerId,
        date: item.date,
        size: item.size,
      })),
      comissions: position.comissions.map((item: any) => ({
        brokerId: item.brokerId,
        comment: item.comment,
        date: item.date,
        size: item.size,
      })),
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
