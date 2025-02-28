import { AccountBroker, AccountCurrency, AccountPortfolio } from './account';

export interface Commission {
  total: number;
  comissionItemitems: CommissionItem[] | null;
}

export interface CommissionItem {
  date: string;
  portfolio: AccountPortfolio;
  broker: AccountBroker;
  currency: AccountCurrency;
  size: number;
}
