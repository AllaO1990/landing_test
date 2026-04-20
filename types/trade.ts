export interface TradeCoreJournal {
	orderId: string | null;
	ideaId: number;
	commission: number;
	direction: boolean;
	expirationType: number;
	externalId: null | string;
	expireDate: string | null;
	ideaDate: string | null;
	instrumentId: string;
	lot: number;
	lots: number;
	price: number;
	quantity: number;
	status: string | null;
	stopPrice: number | null;
	total: number;
	trailingIndent: number;
	trailingIndentType: number;
	trailingSpread: number;
	trailingSpreadType: number;
}

export interface TradeJournal extends TradeCoreJournal {
	accountId: string;
	sourceId: number;
	id: number;
	orderType: number;
	orderTypeText: string;
}

export interface TradeJournalSystem {
	isEdit: boolean;
	change: boolean;
	remove: boolean;
}

export enum TradeJournalStatus {
	UNLOADING = 'UNLOADING', // не отправлена брокеру
	AWAITS = 'AWAITS', // ожидает исполнения на брокере
	PROCESSING = 'PROCESSING', // есть в журнале, нет на брокере, высталвлена менее 60 сек назад
	BROKEN = 'BROKEN', // есть в журнале нет на брокере
	EXECUTED = 'EXECUTED', // исполнена брокером \ пользователем
}
