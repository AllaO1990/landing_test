import { AccountCurrency, AccountPortfolio } from 'types/account';

export interface PortfolioData<T> {
	data: T | null;
	isLoaded: boolean;
	isLoading: boolean;
}

export type PortfolioParams = Partial<PortfolioParamList>;

export interface PortfolioParamList {
	portfolio: AccountPortfolio;
	currency: AccountCurrency;
	from: string | null;
	to: string | null;
	leadToCurrency: string | null;
}
