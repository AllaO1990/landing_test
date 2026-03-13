export interface TradeCoreJournal {
	ideaId: number;
	commission: number;
	direction: boolean;
	expirationType: number;
	expireDate: string | null;
	ideaDate: string | null;
	instrumentId: string;
	lot: number;
	lots: number;
	orderType: number;
	price: number;
	quantity: number;
	status: string;
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
	id: number | null;
	externalId: string | null;
}
