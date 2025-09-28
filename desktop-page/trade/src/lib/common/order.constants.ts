import { TradeOrderTypes } from './api.types';
import { TradeOrderTypeText, TradeStopOrderTypeText } from './order.types';

export const TRADE_ORDERS: TradeOrderTypes = [
  {
    id: 1,
    name: 'Лимитная',
    type: TradeOrderTypeText.ORDER_TYPE_LIMIT,
  },
  {
    id: 2,
    name: 'Рыночная',
    type: TradeOrderTypeText.ORDER_TYPE_MARKET,
  },
  {
    id: 3,
    name: 'Лучшая цена',
    type: TradeOrderTypeText.ORDER_TYPE_BESTPRICE,
  },
  {
    id: 1,
    name: 'Take-profit заявка',
    type: TradeStopOrderTypeText.STOP_ORDER_TYPE_TAKE_PROFIT,
  },
  {
    id: 2,
    name: 'Stop-loss заявка',
    type: TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS,
  },
  {
    id: 3,
    name: 'Stop-limit заявка',
    type: TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LIMIT,
  },
];
