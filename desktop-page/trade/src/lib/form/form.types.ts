import { TradeOperation, TradeOrderType, TradeSource } from '@data-access-trade/types';

export enum ControlValueStatus {
	UNLOADING = 'UNLOADING', // не отправлена брокеру
	AWAITS = 'AWAITS', // ожидает сполнения на брокере
	EXECUTED = 'EXECUTED', // исполнена брокером \ пользователем
}

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
	status: ControlValueStatus;
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

export interface DefaultControlValue {
	removed: boolean;
	change: boolean;
	expireDate: null;
	expirationType: TradeSource;
	instrumentId: string;
	commission: number;
	orderType: null;
	direction: boolean;
	id: null;
	date: null;
	lot: number;
	stopPrice: null;
	trailingData: {
		indent: number;
		indentType: number;
		spread: number;
		spreadType: number;
	};
}

export interface ActualTradeOperation extends TradeOperation {
	lots: number;
}

export type ActualTradeOperations = ActualTradeOperation[];
