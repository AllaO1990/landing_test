import { TradeSources } from '../common/api.types';
import { TradeStopOrderExpirationType } from '../common/order.types';

export const TRADE_EXPIRATION_TYPES: TradeSources = [
  // {
  //   id: 0,
  //   name: TradeStopOrderExpirationType.STOP_ORDER_EXPIRATION_TYPE_UNSPECIFIED,
  // },
  {
    id: 1,
    name: TradeStopOrderExpirationType.STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL,
  },
  {
    id: 2,
    name: TradeStopOrderExpirationType.STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_DATE,
  },
];

export const TRADE_EXCHANGE_ORDER_TYPES: TradeSources = [
  {
    id: 0,
    name: 'Не определено',
  },
  {
    id: 1,
    name: 'Заявка по рыночной цене',
  },
  {
    id: 2,
    name: 'Лимитная заявка',
  },
];
