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
  comissions: number;
  inPosition: number;
  spare: number;
  profit: number;
  profitPct: number;
  fixedProfit: number;
  fixedProfitPct: number;
  fixedSuccessCount: number;
  fixedUnsuccessCount: number;
  inPositionProfit: number;
  inPositionProfitPct: number;
  inPositionSuccessCount: number;
  inPositionUnsuccessCount: number;
  currencySymbol: string;
  ideasComissions: number;
  ideasDividends: number;
  ideasEndPeriodResult: number;
  ideasStartPeriodResult: number;
  startDeposit: number;
  totalEntryPrice: number;
}

export interface AccountBalanceHistory {
  currencySymbol: string;
  items: AccountBalanceHistoryItem[];
}

export interface AccountBalanceHistoryItem {
  balance: number;
  date: string;
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

export interface AccountStructure {
  items: AccountStructureItem[];
  totalPortfolio: {
    currencySymbol: string;
    price: number;
  };
}

export interface AccountStructureItem {
  currencySymbol: string;
  name: string;
  portfolioSharePct: number;
  totalPrice: number;
  usdRate: number;
}

export interface AccountTransactions {
  items: AccountTransaction[];
  total: number;
}

export interface AccountTransaction {
  amount: number;
  broker: {
    broker: string;
    brokerId: number;
  };
  currency: {
    currency: string;
    currencyId: number;
    currencySymbol: string;
  };
  date: string;
  id: number;
  portfolio: {
    portfolio: string;
    portfolioId: number;
  };
  transactionType: string;
}
