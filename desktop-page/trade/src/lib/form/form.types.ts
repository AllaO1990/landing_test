import { TradeOperation, TradeOrderType, TradeSource } from '@data-access-trade/types';
import { TradeJournalStatus } from 'types/trade';

export interface ControlValue {
	change: boolean; // служебная для кнопки spinner
	removed: boolean; // служебная для кнопки spinner
	direction: boolean;
	instrumentId: string;
	orderType: TradeOrderType | null;
	price: number;
	stopPrice: number | null;
	total: number;
	commission: number;
	status: TradeJournalStatus;
	id: string | null;
	lot: number;
	lots: number;
	quantity: number;
	expireDate: string | null;
	expirationType: TradeSource | null;
	trailingData: {
		indent: number;
		indentType: number;
		spread: number | null;
		spreadType: number;
	};
	date: string | null; // для фильтрации по не раньше даты идеи
}

export interface ActualTradeOperation extends TradeOperation {
	lots: number;
}

export type ActualTradeOperations = ActualTradeOperation[];
