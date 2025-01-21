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
