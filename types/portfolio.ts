import { StockId, StockInstrument } from './stock';
import { AccountBroker } from './account';

export interface ResponsePortfolioPosition {
	items: PortfolioPosition[] | null;
	total: number;
}

export interface PortfolioPosition {
	ideaId: StockId;
	parentId: null | StockId;
	createdAt: string;
	updatedAt: string;
	entry: PortfolioPositionEntry | null;
	out: PortfolioPositionEntry | null;
	inPosition: PortfolioPositionEntry;
	positionType: string;
	instrument: StockInstrument;
	dividend: number;
	dividendPct: number;
	fixedResult: number;
	fixedResultPct: number;
	inPositionResult: number;
	inPositionResultPct: number;
	result: number;
	resultPct: number;
	depositSharePct: number;
	strategyKey: string;
	strategyName: string;
	brokers: AccountBroker[];
	comment: string;
	portfolioId: number;
	portfolioName: string;
	author: string;
	roundBase: number;
}

export interface PortfolioPositionEntry {
	amount: number;
	price: number;
	totalPrice: number;
	date: string;
}
