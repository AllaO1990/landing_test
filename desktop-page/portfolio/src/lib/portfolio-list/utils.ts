import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { TuiContext, TuiStringHandler } from '@taiga-ui/cdk';

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
