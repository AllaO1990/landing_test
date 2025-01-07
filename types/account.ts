export interface AccountBroker {
  broker: string;
  brokerId: number;
}

export interface AccountCurrency {
  currency: string;
  currencyId: number;
  currencySymbol: string;
}

export interface AccountPortfolio {
  portfolio: string;
  portfolioId: number;
}

export interface AccountStrategies {
  id: number;
  key: string;
  name: string;
}
