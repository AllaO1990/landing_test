import { TradeOrderTypeDescription, TradeOrderTypesDescription } from './api.types';
import { TradeOrderTypeText, TradeStopOrderTypeText } from './order.types';

export const TRADE_ORDER_TYPE_LIMIT: TradeOrderTypeDescription = {
  id: 1,
  name: 'Лимитная',
  type: TradeOrderTypeText.ORDER_TYPE_LIMIT,
};

export const TRADE_ORDER_TYPE_MARKET: TradeOrderTypeDescription = {
  id: 2,
  name: 'Рыночная',
  type: TradeOrderTypeText.ORDER_TYPE_MARKET,
};

export const TRADE_ORDER_TYPE_BESTPRICE: TradeOrderTypeDescription = {
  id: 3,
  name: 'Лучшая цена',
  type: TradeOrderTypeText.ORDER_TYPE_BESTPRICE,
};

export const TRADE_STOP_ORDER_TYPE_TAKE_PROFIT: TradeOrderTypeDescription = {
  id: 1,
  name: 'Take-profit',
  type: TradeStopOrderTypeText.STOP_ORDER_TYPE_TAKE_PROFIT,
};

export const TRADE_STOP_ORDER_TYPE_STOP_LOSS: TradeOrderTypeDescription = {
  id: 2,
  name: 'Stop-loss',
  type: TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS,
};

export const TRADE_STOP_ORDER_TYPE_STOP_LIMIT: TradeOrderTypeDescription = {
  id: 3,
  name: 'Stop-limit',
  type: TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LIMIT,
};

export const TRADE_ORDERS: TradeOrderTypesDescription = [
  TRADE_ORDER_TYPE_LIMIT,
  TRADE_ORDER_TYPE_MARKET,
  TRADE_ORDER_TYPE_BESTPRICE,
  TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
  TRADE_STOP_ORDER_TYPE_STOP_LOSS,
  TRADE_STOP_ORDER_TYPE_STOP_LIMIT,
];
