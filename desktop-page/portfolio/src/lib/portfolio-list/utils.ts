import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { TuiContext, TuiDay, TuiStringHandler } from '@taiga-ui/cdk';
import { Params } from '@angular/router';

export const stringifyCurrency = (items: readonly AccountCurrency[]): TuiStringHandler<TuiContext<number>> => {
  const map = new Map(items.map(({ currencySymbol, currencyId }) => [currencyId, currencySymbol] as [number, string]));

  return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
};

export const stringifyBroker = (items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> => {
  const map = new Map(items.map(({ broker, brokerId }) => [brokerId, broker] as [number, string]));

  return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
};

export const stringifyPortfolio = (items: readonly AccountPortfolio[]): TuiStringHandler<TuiContext<number>> => {
  const map = new Map(items.map(({ portfolio, portfolioId }) => [portfolioId, portfolio] as [number, string]));

  return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
};

export const getParamsFromFilter = (value: any): Params => {
  const { range, portfolio, broker, currency } = value;
  let from: string | null = null;
  let to: string | null = null;
  let portfolioId: number | null = null;
  let brokerId: number | null = null;
  let currencyId: number | null = null;

  if (range !== null) {
    from = new Date((range.from as TuiDay).toUtcNativeDate().setUTCHours(0, 0, 0)).toISOString();
    to = new Date((range.to as TuiDay).toUtcNativeDate().setUTCHours(23, 59, 59)).toISOString();
  }

  if (portfolio !== null && portfolio.portfolioId !== null) {
    portfolioId = portfolio.portfolioId;
  }

  if (broker !== null && broker.brokerId !== null) {
    brokerId = broker.brokerId;
  }

  if (currency !== null && currency.currencyId !== null) {
    currencyId = currency.currencyId;
  }

  return { brokerId, currencyId, portfolioId, from, to };
};
