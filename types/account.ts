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
  date: string;
  deposit: number;
  income: number;
  expence: number;
  comission: number;
  inPosition: number;
  spare: number;
  profit: number;
  profitPct: number;
  fixedProfit: number;
  fixedSuccessCount: number;
  fixedUnsuccessCount: number;
  inPositionProfit: number;
  inPositionSuccessCount: number;
  inPositionUnsuccessCount: number;
  currencySymbol: string;
}

export interface AccountRange {
  from: string;
  to: string;
}

export interface AccountDeposit {
  amount: number;
  brokerId: number;
  currencyId: number;
  id: number;
  portfolioId: number;
}
