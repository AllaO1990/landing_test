import { Injectable } from '@angular/core';
import { StockPosition, StockPositionActionEntry, StockPositionActionTarget } from 'types/position';
import {
  TradeOperation,
  TradeOperations,
  TradeOrder,
  TradeOrders,
  TradeOrderType,
  TradeSource,
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
  TRADE_ORDER_TYPE_MARKET,
  TRADE_STOP_ORDER_TYPE_STOP_LOSS,
  TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
} from '../common/order.constants';
import { TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL } from '../request/request.constants';
import { TradeStopOrderTypeText } from '../common/order.types';
import { WithLastPrice } from 'types/stock';

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

  /**
   * Фильтр операций, которых ещё нет в сделке
   * */
  getFilteredOperations(
    lotsInPosition: number[],
    operations: ActualTradeOperations,
    operationType: 15 | 22
  ): ActualTradeOperations {
    const tempLots = lotsInPosition.slice();

    return operations
      .filter((item: ActualTradeOperation) => item.type === operationType && item.state === 1)
      .filter(
        (item: ActualTradeOperation) =>
          tempLots.findIndex((itemLots: number, index: number) => {
            if (itemLots === item.lots) {
              tempLots[index] = -1;
              return -1;
            }

            return index;
          }) === -1
      );
  }

  getEntryControlValue(
    position: StockPosition,
    orders: TradeOrders,
    stopOrders: TradeStopOrders,
    operationsDirection: ActualTradeOperations,
    filter: { lastPrice: WithLastPrice; source: TradeSource }
  ): {
    orders: ControlValue[];
    actions: ControlValue[];
    ideas: ControlValue[];
  } {
    const { lastPrice, source } = filter;
    const defaultItem = this.getDefaultControlValue(position);
    const entries = position.actions.entries.filter((item: StockPositionActionEntry) => item.brokerId === source.id);

    const actionQuantity = entries.map((item) => Math.floor(item.amount / defaultItem.lot));
    const ordersDirection = orders.filter((item: TradeOrder) => +item.direction === +defaultItem.direction);
    const stopOrdersDirection = stopOrders.filter((item: TradeStopOrder) => +item.direction === +defaultItem.direction);

    const executedControlValues: ControlValue[] = entries.map((item): ControlValue => {
      const lots = Math.floor(item.amount / defaultItem.lot);

      const findOperation =
        operationsDirection.find((operation: ActualTradeOperation) => {
          return operation.lots === lots;
        }) || null;

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

          const percent = this._getPriceToTarget(lastPrice.last, item.price);

          acc.push({
            ...defaultItem,
            price: item.price,
            commission: 0,
            quantity: item.quantity,
            lots,
            total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
            orderType: this._getOrderType(percent === null ? 1 : percent),
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
    filter: { source: TradeSource }
  ): {
    orders: ControlValue[];
    actions: ControlValue[];
    ideas: ControlValue[];
  } {
    const { source } = filter;
    const defaultItem = this.getDefaultControlValue(position, 'reverse');
    const outs = position.actions.outs.filter((item: StockPositionActionTarget) => item.brokerId === source.id);
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
        direction: item.direction,
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
    temp: ControlValue[],
    orders: TradeOrders,
    stopOrders: TradeStopOrders,
    operations: ActualTradeOperations
  ): (ControlValue & { disabled: boolean }) | null {
    const stopPrice = position.idea.stop ? position.idea.stop.price : 0;

    if (stopPrice === 0) {
      return null;
    }

    const entryLots = position.actions.entries.reduce(
      (acc: number, item: StockPositionActionEntry) => (acc += item.amount),
      0
    );
    const outLots = position.actions.outs.reduce(
      (acc: number, item: StockPositionActionTarget) => (acc += item.amount),
      0
    );

    if (entryLots === outLots && entryLots !== 0) {
      return null;
    }

    const defaultItem = this.getDefaultControlValue(position, 'reverse');
    const precision = position.idea.instrument.source === 'tinkoff' ? 0 : 8;
    const lots = getNumberPrecision(position.idea.inPositionQuantity / defaultItem.lot, precision);

    // if (position.idea.targets.length) {
    //   if (position.idea.targets.length === 1) {
    //     stopPrice = position.idea.targets[0].price;
    //   }
    //   if (position.idea.targets.length > 1) {
    //     stopPrice = position.idea.targets[position.idea.targets.length - 2].price;
    //     console.log(position, position.idea.targets[position.idea.targets.length - 2].price);
    //   }
    // }

    const control = {
      ...defaultItem,
      disabled: false,
      price: stopPrice,
      lots: lots,
      quantity: getNumberPrecision(lots * defaultItem.lot, precision),
      total: getNumberPrecision(stopPrice * lots * defaultItem.lot, 2),
      commission: 0,
      stopPrice: stopPrice,
      orderType: TRADE_STOP_ORDER_TYPE_STOP_LOSS,
      status: ControlValueStatus.UNLOADING,
    };

    const filterStopOrder =
      stopOrders.find(
        (item: TradeStopOrder) =>
          item.direction === defaultItem.direction &&
          item.orderTypeText === TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS &&
          item.lotsRequested === control.lots
      ) || null;

    if (filterStopOrder !== null) {
      return {
        ...control,
        id: filterStopOrder.stopOrderId,
        price: filterStopOrder.price.value,
        stopPrice: filterStopOrder.stopPrice.value,
        orderType: TRADE_STOP_ORDER_TYPE_STOP_LOSS,
        status: ControlValueStatus.AWAITS,
      };
    }

    const filterOrder =
      orders.find(
        (item: TradeOrder) => !!item.direction === defaultItem.direction && item.lotsRequested === control.lots
      ) || null;

    if (filterOrder !== null) {
      return {
        ...control,
        id: filterOrder.orderId,
        price: filterOrder.initialSecurityPrice.value,
        stopPrice: filterOrder.initialSecurityPrice.value,
        orderType: { type: filterOrder.orderTypeText, id: filterOrder.orderType },
        status: ControlValueStatus.AWAITS,
      };
    }

    if (operations.length > 0 && entryLots === outLots) {
      if (temp.length === 1) {
        const findIndex = operations.findIndex((item: ActualTradeOperation) => item.lots === temp[0].lots);

        if (findIndex !== -1) {
          return {
            ...temp[0],
            disabled: true,
            status: ControlValueStatus.EXECUTED,
          };
        }
      }

      const findIndex = operations.findIndex((item: ActualTradeOperation) => item.lots === lots);

      if (findIndex !== -1) {
        return {
          ...control,
          disabled: true,
          status: ControlValueStatus.EXECUTED,
        };
      }
    }

    return control;
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

  getIdeaStopLossToStop(position: StockPosition): StockPosition {
    let stop = position.idea.stop;

    if (stop) {
      stop = {
        ...stop,
        price: 0,
      };
    }

    return {
      ...position,
      idea: {
        ...position.idea,
        stop,
      },
    };
  }

  getIdeaStopLossToTarget(position: StockPosition): StockPosition {
    let stopPrice = position.idea.stop;

    if (position.actions.outs.length) {
      if (position.actions.outs.length === 1 && stopPrice) {
        stopPrice = {
          ...stopPrice,
          price: position.actions.outs[0].price,
        };
      }
      if (position.actions.outs.length > 1 && stopPrice) {
        stopPrice = {
          ...stopPrice,
          price: position.actions.outs[position.actions.outs.length - 2].price,
        };
      }
    }

    return {
      ...position,
      idea: {
        ...position.idea,
        stop: stopPrice,
      },
    };
  }

  private _getPriceToTarget(lastPrice: number, price: number | null): number | null {
    if (price === null) {
      return null;
    }

    return Math.abs(((lastPrice - price) / price) * 100);
  }

  private _getOrderType(percent: number): TradeOrderType {
    return percent <= 0.5 ? TRADE_ORDER_TYPE_MARKET : TRADE_ORDER_TYPE_LIMIT;
  }
}
