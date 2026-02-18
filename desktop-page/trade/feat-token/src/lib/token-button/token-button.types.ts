export interface TradeTokenCompleted {
	type: TradeTokenCompleteType;
	data: any;
}

export enum TradeTokenCompleteType {
	CHANGE = 'change',
	REMOVE = 'remove',
}
