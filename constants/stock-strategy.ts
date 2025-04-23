import { StockStrategyEnums } from '../types/stock-strategy';
import { AccountStrategy } from '../types/account';

export const STOCK_STRATEGY: { [key in StockStrategyEnums]: string } = {
  [StockStrategyEnums.CONSOLIDATION]: 'Консолидация',
  [StockStrategyEnums.CONSOLIDATION_WATCHLIST]: 'Консолидация (вотчлист)',
  [StockStrategyEnums.ACTIVE_ZONE]: 'Активная зона',
  [StockStrategyEnums.MOVING]: 'Скользящие',
  [StockStrategyEnums.USER]: 'Пользователь',
  [StockStrategyEnums.ACTIVE_ZONE_BEARISH_ENGULFING]: 'АЗТ (Поглощение продавцами)',
  [StockStrategyEnums.ACTIVE_ZONE_BULLISH_ENGULFING]: 'АЗТ (Поглощение покупателями)',
};

export const STOCK_STRATEGY_LIST: (AccountStrategy & { disabled: boolean })[] = [
  {
    id: 1,
    key: StockStrategyEnums.CONSOLIDATION,
    name: STOCK_STRATEGY[StockStrategyEnums.CONSOLIDATION],
    disabled: false,
  },
  {
    id: 2,
    key: StockStrategyEnums.ACTIVE_ZONE,
    name: STOCK_STRATEGY[StockStrategyEnums.ACTIVE_ZONE],
    disabled: false,
  },
  {
    id: 3,
    key: StockStrategyEnums.MOVING,
    name: STOCK_STRATEGY[StockStrategyEnums.MOVING],
    disabled: false,
  },
  {
    id: 4,
    key: StockStrategyEnums.USER,
    name: STOCK_STRATEGY[StockStrategyEnums.USER],
    disabled: false,
  },
];
