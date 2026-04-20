export interface TradeOrderBook {
	asks: TradeOrderBookAsk[];
	bids: TradeOrderBookBid[];
	closePrice: number;
	depth: number;
	lastPrice: number;
	limitDown: number;
	limitUp: number;
	orderbookTs: string;
}

export interface TradeOrderBookAsk {
	price: number;
	quantity: number;
}

export interface TradeOrderBookBid {
	price: number;
	quantity: number;
}
