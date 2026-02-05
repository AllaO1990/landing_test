import { TradeSource, TradeSources } from '@data-access-trade/types';
import { TradeStopOrderExpirationType } from '@data-access-trade/order.types';

export const TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL: TradeSource = {
	id: 1,
	name: TradeStopOrderExpirationType.STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL,
};

export const TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_DATE: TradeSource = {
	id: 2,
	name: TradeStopOrderExpirationType.STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_DATE,
};

export const TRADE_EXPIRATION_TYPES: TradeSources = [
	// {
	//   id: 0,
	//   name: TradeStopOrderExpirationType.STOP_ORDER_EXPIRATION_TYPE_UNSPECIFIED,
	// },
	TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL,
	TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_DATE,
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
