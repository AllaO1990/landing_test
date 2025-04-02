import { AccountBroker, AccountCurrency, AccountPortfolio } from './account';
import { StockInstrument } from './stock';

export interface Commission {
  total: number;
  items: CommissionItem[] | null;
}

export interface CommissionItem {
  date: string;
  portfolio: AccountPortfolio;
  broker: AccountBroker;
  currency: AccountCurrency;
  instrument: null | StockInstrument;
  ideaId: null | any;
  comment: string | null;
  size: number;
  id: number;
}
