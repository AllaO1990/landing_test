import { Injectable } from '@angular/core';
import { StockPosition, StockPositionActionEntry, StockPositionActionTarget } from 'types/position';
import {
  TradeOperation,
  TradeOperations,
  TradeOrder,
  TradeOrders,
  TradeStopOrder,
  TradeStopOrders,
} from '../common/api.types';
import { sortNumber } from 'utils/sort-number';
import {
  ActualTradeOperation,
  ActualTradeOperations,
  ControlValue,
  ControlValueStatus,
  DefaultControlValue,
} from './form.types';
import { getNumberPrecision } from 'utils/get-number-precision';
import {
  TRADE_ORDER_TYPE_LIMIT,
  TRADE_STOP_ORDER_TYPE_STOP_LOSS,
  TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
} from '../common/order.constants';
import { TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL } from '../request/request.constants';
import { TradeStopOrderTypeText } from '../common/order.types';

@Injectable()
export class TradeFormService {
  getOperationType(direction: boolean): 15 | 22 {
    return direction ? 15 : 22;
  }

  getDefaultControlValue(position: StockPosition, positionType: 'direct' | 'reverse' = 'direct'): DefaultControlValue {
    const direction = position.idea.positionType === 'long';
    const minPriceIncrement = position.idea.instrument.minPriceIncrement;

    return {
      removed: false,
      change: false,
      expireDate: null,
      expirationType: TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL,
      orderType: null,
      instrumentId: position.idea.instrument.id,
      commission: 0,
      direction: positionType === 'direct' ? direction : !direction,
      id: null,
      date: null,
      lot: position.idea.instrument.lot,
      stopPrice: null,
      trailingData: {
        indent: 1,
        indentType: 1,
        spread: getNumberPrecision(minPriceIncrement * 3, 2),
        spreadType: 1,
      },
    };
  }

  getActualOperations(position: StockPosition, operations: TradeOperations): ActualTradeOperations {
    const createAt = position.idea.createdAt && new Date(position.idea.createdAt).valueOf();
    const actualOperations = createAt
      ? operations.filter((item: TradeOperation) => new Date(item.date).valueOf() > createAt)
      : operations;

    return actualOperations.map((item: TradeOperation) => ({
      ...item,
      lots: Math.floor(item.quantity / position.idea.instrument.lot),
    }));
  }

  getFilteredOperations(
    lots: number[],
    operations: ActualTradeOperations,
    operationType: 15 | 22
  ): ActualTradeOperations {
    const tempLots = lots.slice();

    return operations
      .filter((item: ActualTradeOperation) => item.type === operationType && item.state === 1)
      .filter(
        (item: ActualTradeOperation) =>
          tempLots.findIndex((lots: number, index: number) => {
            if (lots === item.lots) {
              tempLots[index] = -1;
              return true;
            }

            return false;
          }) === -1
      );
  }

  getEntryControlValue(
    position: StockPosition,
    orders: TradeOrders,
    stopOrders: TradeStopOrders,
    operationsDirection: ActualTradeOperations,
    sourceId: number
  ): {
    orders: ControlValue[];
    actions: ControlValue[];
    ideas: ControlValue[];
  } {
    const defaultItem = this.getDefaultControlValue(position);
    const entries = position.actions.entries.filter((item: StockPositionActionEntry) => item.brokerId === sourceId);

    const actionQuantity = entries.map((item) => Math.floor(item.amount / defaultItem.lot));
    const ordersDirection = orders.filter((item: TradeOrder) => +item.direction === +defaultItem.direction);
    const stopOrdersDirection = stopOrders.filter((item: TradeStopOrder) => +item.direction === +defaultItem.direction);

    const executedControlValues: ControlValue[] = entries.map((item): ControlValue => {
      const lots = Math.floor(item.amount / defaultItem.lot);

      const findOperation =
        operationsDirection.find((operation: ActualTradeOperation) => operation.lots === lots) || null;

      return {
        ...defaultItem,
        price: item.price,
        quantity: item.amount,
        commission: findOperation && findOperation.comission ? Math.abs(findOperation.comission.value) : 0,
        lots,
        total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
        status: ControlValueStatus.EXECUTED,
      };
    });

    const unloadingOrdersDirection = ordersDirection.map((item) => ({ ...item }));
    const unloadingStopOrdersDirection = stopOrdersDirection.map((item) => ({ ...item }));

    let unloadingControlValues: ControlValue[] = [];

    if (ordersDirection.length === 0 && stopOrdersDirection.length === 0 && executedControlValues.length === 0) {
      unloadingControlValues = position.idea.entries
        .filter((item) => !actionQuantity.includes(Math.floor(item.quantity / defaultItem.lot)))
        .reduce((acc: ControlValue[], item) => {
          const lots = Math.floor(item.quantity / defaultItem.lot);

          if (unloadingOrdersDirection.length > 0) {
            const findIndexOrder = unloadingOrdersDirection.findIndex((orderItem: TradeOrder) => {
              return orderItem.lotsRequested === lots;
            });

            if (findIndexOrder !== -1) {
              unloadingOrdersDirection[findIndexOrder].lotsRequested = -1;
              return acc;
            }
          }

          if (unloadingStopOrdersDirection.length > 0) {
            const findIndexOrder = unloadingStopOrdersDirection.findIndex((orderItem: TradeStopOrder) => {
              return orderItem.lotsRequested === lots;
            });

            if (findIndexOrder !== -1) {
              unloadingStopOrdersDirection[findIndexOrder].lotsRequested = -1;
              return acc;
            }
          }

          acc.push({
            ...defaultItem,
            price: item.price,
            commission: 0,
            quantity: item.quantity,
            lots,
            total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
            orderType: TRADE_ORDER_TYPE_LIMIT,
            status: ControlValueStatus.UNLOADING,
          });

          return acc;
        }, []);
    }

    const orderControlValues: ControlValue[] = ordersDirection.map((item: TradeOrder) => ({
      ...defaultItem,
      id: item.orderId,
      price: item.initialSecurityPrice.value,
      quantity: item.lotsRequested * defaultItem.lot,
      lots: item.lotsRequested,
      orderType: {
        id: item.orderType,
        type: item.orderTypeText,
      },
      commission: item.initialCommission ? item.initialCommission.value : 0,
      direction: !!item.direction,
      total: getNumberPrecision(item.initialSecurityPrice.value * item.lotsRequested * defaultItem.lot, 2),
      status: ControlValueStatus.AWAITS,
    }));

    const stopOrderControlValues: ControlValue[] = stopOrdersDirection.map((item: TradeStopOrder) => ({
      ...defaultItem,
      id: item.stopOrderId,
      price: item.price.value,
      quantity: item.lotsRequested * defaultItem.lot,
      lots: item.lotsRequested,
      orderType: {
        id: item.orderType,
        type: item.orderTypeText,
      },
      stopPrice: item.stopPrice.value,
      trailingData: item.trailingData,
      commission: 0,
      direction: !!item.direction,
      total: getNumberPrecision(item.price.value * item.lotsRequested * defaultItem.lot, 2),
      status: ControlValueStatus.AWAITS,
    }));

    return {
      actions: executedControlValues,
      ideas: unloadingControlValues,
      orders: [...orderControlValues, ...stopOrderControlValues],
    };
  }

  getOutControlValue(
    position: StockPosition,
    orders: TradeOrders,
    stopOrders: TradeStopOrders,
    operationsDirection: ActualTradeOperations,
    sourceId: number
  ): {
    orders: ControlValue[];
    actions: ControlValue[];
    ideas: ControlValue[];
  } {
    const defaultItem = this.getDefaultControlValue(position, 'reverse');
    const outs = position.actions.outs.filter((item: StockPositionActionTarget) => item.brokerId === sourceId);
    const ordersDirection = orders.filter((item: TradeOrder) => +item.direction === +defaultItem.direction);
    const stopOrdersDirection = stopOrders.filter((item: TradeStopOrder) => +item.direction === +defaultItem.direction);

    const executedControlValues: ControlValue[] = outs.map((item): ControlValue => {
      const lots = Math.floor(item.amount / defaultItem.lot);

      const findOperation =
        operationsDirection.find((operation: ActualTradeOperation) => operation.lots === lots) || null;

      return {
        ...defaultItem,
        price: item.price,
        stopPrice: item.price,
        lots,
        commission: findOperation ? Math.abs(findOperation.comission.value) : 0,
        quantity: item.amount,
        total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
        status: ControlValueStatus.EXECUTED,
      };
    });

    const unloadingOrdersDirection = ordersDirection.map((item: TradeOrder) => ({ ...item }));
    const unloadingStopOrdersDirection = stopOrdersDirection.map((item: TradeStopOrder) => ({ ...item }));

    const unloadingControlValues: ControlValue[] = position.idea.targets.reduce((acc: ControlValue[], item) => {
      const lots = Math.floor(item.amount / defaultItem.lot);

      if (unloadingOrdersDirection.length > 0) {
        const findIndexOrder = unloadingOrdersDirection.findIndex((orderItem: TradeOrder) => {
          return orderItem.lotsRequested === lots;
        });

        if (findIndexOrder !== -1) {
          unloadingOrdersDirection[findIndexOrder].lotsRequested = -1;
          return acc;
        }
      }

      if (unloadingStopOrdersDirection.length > 0) {
        const findIndexOrder = unloadingStopOrdersDirection.findIndex((orderItem: TradeStopOrder) => {
          return orderItem.lotsRequested === lots;
        });

        if (findIndexOrder !== -1) {
          unloadingStopOrdersDirection[findIndexOrder].lotsRequested = -1;
          return acc;
        }
      }

      acc.push({
        ...defaultItem,
        price: item.price,
        stopPrice: item.price,
        commission: 0,
        lots,
        quantity: item.amount,
        total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
        orderType: TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
        status: ControlValueStatus.UNLOADING,
      });

      return acc;
    }, []);

    const orderControlValues: ControlValue[] = ordersDirection.map((item) => ({
      ...defaultItem,
      id: item.orderId,
      price: item.averagePositionPrice.value,
      quantity: item.lotsRequested * defaultItem.lot,
      lots: item.lotsRequested,
      commission: item.initialCommission ? item.initialCommission.value : 0,
      orderType: {
        id: item.orderType,
        type: item.orderTypeText,
      },
      direction: !!item.direction,
      total: getNumberPrecision(item.averagePositionPrice.value * item.lotsRequested * defaultItem.lot, 2),
      status: ControlValueStatus.AWAITS,
    }));

    const stopOrderControlValues: ControlValue[] = stopOrdersDirection
      .filter((item: TradeStopOrder) => item.orderTypeText === TradeStopOrderTypeText.STOP_ORDER_TYPE_TAKE_PROFIT)
      .map((item) => ({
        ...defaultItem,
        id: item.stopOrderId,
        price: item.price.value,
        quantity: item.lotsRequested * defaultItem.lot,
        lots: item.lotsRequested,
        commission: 0,
        orderType: {
          id: item.orderType,
          type: item.orderTypeText,
        },
        stopPrice: item.stopPrice.value,
        trailingData: item.trailingData,
        direction: !!item.direction,
        total: getNumberPrecision(item.price.value * item.lotsRequested * defaultItem.lot, 2),
        status: ControlValueStatus.AWAITS,
      }));

    return {
      actions: executedControlValues,
      ideas: unloadingControlValues,
      orders: [...orderControlValues, ...stopOrderControlValues],
    };
  }

  getStopLossControlValue(
    position: StockPosition,
    entry: ControlValue[],
    out: ControlValue[],
    orders: TradeOrders,
    stopOrders: TradeStopOrders,
    operations: TradeOperations
  ): ControlValue & { disabled: boolean } {
    const defaultItem = this.getDefaultControlValue(position, 'reverse');
    const entryControlValue = entry.filter((item: ControlValue) => item.status !== ControlValueStatus.UNLOADING);
    const outControlValue = out.filter((item: ControlValue) => item.status !== ControlValueStatus.UNLOADING);

    const stopPrice = position.idea.stop ? position.idea.stop.price : 0;
    const entryQuantity = entryControlValue.reduce((acc: number, item: ControlValue) => {
      if (item.status === ControlValueStatus.EXECUTED) {
        acc += item.lots;
      }

      return acc;
    }, 0);
    const outQuantity = outControlValue.reduce((acc: number, item: ControlValue) => {
      if (item.status === ControlValueStatus.EXECUTED) {
        acc += item.lots;
      }

      return acc;
    }, 0);
    const lots = Math.abs(entryQuantity)
      ? Math.abs(entryQuantity)
      : entry.reduce((acc: number, item: ControlValue) => (acc += item.lots), 0);

    const control = {
      ...defaultItem,
      disabled: false,
      price: stopPrice,
      quantity: lots * defaultItem.lot,
      lots: lots,
      total: getNumberPrecision(stopPrice * lots * defaultItem.lot, 2),
      commission: 0,
      stopPrice: stopPrice,
      orderType: TRADE_STOP_ORDER_TYPE_STOP_LOSS,
      status: ControlValueStatus.UNLOADING,
    };

    if (operations.length > 0) {
      const findIndex = operations.findIndex(
        (item: TradeOperation) => item.quantity === lots && item.price.value === stopPrice
      );

      if (findIndex !== -1) {
        return {
          ...control,
          status: ControlValueStatus.EXECUTED,
        };
      }
    }

    if (orders.length > 0) {
      const findIndex = orders.findIndex(
        (item: TradeOrder) => item.lotsRequested === lots && item.initialSecurityPrice.value === stopPrice
      );

      if (findIndex !== -1) {
        return {
          ...control,
          id: orders[findIndex].orderId,
          status: ControlValueStatus.AWAITS,
        };
      }
    }

    if (stopOrders.length > 0) {
      const findIndex = stopOrders.findIndex(
        (item: TradeStopOrder) => item.lotsRequested === lots && item.stopPrice.value === stopPrice
      );

      if (findIndex !== -1) {
        return {
          ...control,
          id: stopOrders[findIndex].stopOrderId,
          status: ControlValueStatus.AWAITS,
        };
      }
    }

    console.log(outQuantity, entryQuantity);

    return {
      ...control,
      disabled: outQuantity === entryQuantity,
    };
  }

  updateIdea(position: StockPosition, entries: TradeOperations, outs: TradeOperations, commissions: TradeOperations) {
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
        ...commissions
          .filter((item: any) => item.comission.value !== 0)
          .map((item: TradeOperation) => ({
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

  getCalcOutIdea(outIdea: ControlValue[], entryLots: number, priceIncrement: number): ControlValue[] {
    const precision = priceIncrement === 8 ? priceIncrement : 0;
    const ratio: number[][] = [[1], [0.6, 0.4], [0.4, 0.3, 0.3]];
    let enterLotsIndex = 2;
    let quantity = 0;

    if (entryLots <= 3) {
      enterLotsIndex = (entryLots % 2) + 1;
    }

    if (outIdea.length === 2) {
      enterLotsIndex = 1;
    }

    return ratio[enterLotsIndex].reduce((acc: ControlValue[], pct: number, index: number, array: number[]) => {
      if (!outIdea[index]) {
        return acc;
      }

      let amount = getNumberPrecision(entryLots * pct, precision);

      if (entryLots === 1) {
        if (index === 1) {
          amount = 1;
        } else {
          return acc;
        }
      }

      if (index === array.length - 1 || index === outIdea.length - 1) {
        amount = getNumberPrecision(entryLots - quantity, precision);

        if (amount === 0) {
          return acc;
        }
      }

      quantity += amount;

      const item = outIdea[index];

      acc.push({
        ...item,
        lots: amount,
        quantity: getNumberPrecision(amount * item.lot, precision),
        total: getNumberPrecision(amount * item.lot * item.price, 2),
      });

      return acc;
    }, []);
  }
}
