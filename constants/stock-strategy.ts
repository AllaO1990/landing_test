import { StockStrategyEnums } from '../types/stock-strategy';

export const STOCK_STRATEGY: { [key in StockStrategyEnums]: string } = {
  [StockStrategyEnums.CONSOLIDATION]: 'Консолидация',
  [StockStrategyEnums.ACTIVE_ZONE]: 'Активная зона',
  [StockStrategyEnums.SLIDING]: 'Скользящие',
  [StockStrategyEnums.USER]: 'Пользователь',
};

export const STOCK_STRATEGY_LIST: { id: StockStrategyEnums; name: string; disabled: boolean }[] = [
  {
    id: StockStrategyEnums.CONSOLIDATION,
    name: STOCK_STRATEGY[StockStrategyEnums.CONSOLIDATION],
    disabled: false,
  },
  {
    id: StockStrategyEnums.ACTIVE_ZONE,
    name: STOCK_STRATEGY[StockStrategyEnums.ACTIVE_ZONE],
    disabled: false,
  },
  {
    id: StockStrategyEnums.SLIDING,
    name: STOCK_STRATEGY[StockStrategyEnums.SLIDING],
    disabled: false,
  },
  {
    id: StockStrategyEnums.USER,
    name: STOCK_STRATEGY[StockStrategyEnums.USER],
    disabled: false,
  },
];
