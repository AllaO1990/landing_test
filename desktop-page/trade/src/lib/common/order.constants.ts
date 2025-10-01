import { TradeOrderType, TradeOrderTypes } from './api.types';
import { TradeOrderTypeText, TradeStopOrderTypeText } from './order.types';

export const TRADE_ORDER_TYPE_LIMIT: TradeOrderType = {
  id: 1,
  name: 'Лимитная',
  type: TradeOrderTypeText.ORDER_TYPE_LIMIT,
};

export const TRADE_ORDER_TYPE_MARKET: TradeOrderType = {
  id: 2,
  name: 'Рыночная',
  type: TradeOrderTypeText.ORDER_TYPE_MARKET,
};

export const TRADE_ORDER_TYPE_BESTPRICE: TradeOrderType = {
  id: 3,
  name: 'Лучшая цена',
  type: TradeOrderTypeText.ORDER_TYPE_BESTPRICE,
};

export const TRADE_STOP_ORDER_TYPE_TAKE_PROFIT: TradeOrderType = {
  id: 1,
  name: 'Take-profit заявка',
  type: TradeStopOrderTypeText.STOP_ORDER_TYPE_TAKE_PROFIT,
};

export const TRADE_STOP_ORDER_TYPE_STOP_LOSS: TradeOrderType = {
  id: 2,
  name: 'Stop-loss заявка',
  type: TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS,
};

export const TRADE_STOP_ORDER_TYPE_STOP_LIMIT: TradeOrderType = {
  id: 3,
  name: 'Stop-limit заявка',
  type: TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LIMIT,
};

export const TRADE_ORDERS: TradeOrderTypes = [
  TRADE_ORDER_TYPE_LIMIT,
  TRADE_ORDER_TYPE_MARKET,
  TRADE_ORDER_TYPE_BESTPRICE,
  TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
  TRADE_STOP_ORDER_TYPE_STOP_LOSS,
  TRADE_STOP_ORDER_TYPE_STOP_LIMIT,
];
