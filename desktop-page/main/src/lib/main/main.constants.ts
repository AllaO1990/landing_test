import { StockStrategy, StockStrategyDirectory } from 'types/stock-strategy';

export const MAIN_FILTER_STOCK = [
  {
    id: 'moex',
    name: 'Акции',
  },
  {
    id: 'futures',
    name: 'Фьючерсы',
  },
  {
    id: 'currency',
    name: 'Валюта',
  },
  {
    id: 'metal',
    name: 'Металлы',
  },
  {
    id: 'crypto',
    name: 'Крипто',
  },
];

export const MAIN_FILTER_STRATEGY: { id: StockStrategy; name: string }[] = [
  {
    id: StockStrategy.CONSOLIDATION,
    name: StockStrategyDirectory[StockStrategy.CONSOLIDATION],
  },
  {
    id: StockStrategy.ACTIVE_ZONE,
    name: StockStrategyDirectory[StockStrategy.ACTIVE_ZONE],
  },
  {
    id: StockStrategy.SLIDING,
    name: StockStrategyDirectory[StockStrategy.SLIDING],
  },
  {
    id: StockStrategy.USER,
    name: StockStrategyDirectory[StockStrategy.USER],
  },
];
