export interface AccountBroker {
  broker: string;
  brokerId: number | null;
}

export interface AccountCurrency {
  currency: string;
  currencyId: number | null;
  currencySymbol: string;
}

export interface AccountPortfolio {
  portfolio: string;
  portfolioId: number | null;
}

export interface AccountStrategies {
  id: number;
  key: string;
  name: string;
}

export interface AccountBalance {
  comission: number;
  currencySymbol: string;
  date: string;
  deposit: number;
  expence: number;
  inPosition: number;
  income: number;
  profit: number;
  spare: number;
  successCount: number;
  totalCount: number;
  turnover: number;
  unsuccessCount: number;
}

export interface AccountRange {
  from: string;
  to: string;
}
