import { StockStrategyEnums } from '../types/stock-strategy';

export const STOCK_STRATEGY: { [key in StockStrategyEnums]: string } = {
  [StockStrategyEnums.CONSOLIDATION]: 'Консолидация',
  [StockStrategyEnums.CONSOLIDATION_WATCHLIST]: 'Консолидация (вотчлист)',
  [StockStrategyEnums.ACTIVE_ZONE]: 'Активная зона',
  [StockStrategyEnums.SLIDING]: 'Скользящие',
  [StockStrategyEnums.USER]: 'Пользователь',
  [StockStrategyEnums.ACTIVE_ZONE_BEARISH_ENGULFING]: 'АЗТ (Поглощение продавцами)',
  [StockStrategyEnums.ACTIVE_ZONE_BULLISH_ENGULFING]: 'АЗТ (Поглощение покупателями)',
};

export const STOCK_STRATEGY_LIST: { id: StockStrategyEnums[]; name: string; disabled: boolean }[] = [
  {
    id: [StockStrategyEnums.CONSOLIDATION, StockStrategyEnums.CONSOLIDATION_WATCHLIST],
    name: STOCK_STRATEGY[StockStrategyEnums.CONSOLIDATION],
    disabled: false,
  },
  {
    id: [
      StockStrategyEnums.ACTIVE_ZONE,
      StockStrategyEnums.ACTIVE_ZONE_BEARISH_ENGULFING,
      StockStrategyEnums.ACTIVE_ZONE_BULLISH_ENGULFING,
    ],
    name: STOCK_STRATEGY[StockStrategyEnums.ACTIVE_ZONE],
    disabled: false,
  },
  {
    id: [StockStrategyEnums.SLIDING],
    name: STOCK_STRATEGY[StockStrategyEnums.SLIDING],
    disabled: false,
  },
  {
    id: [StockStrategyEnums.USER],
    name: STOCK_STRATEGY[StockStrategyEnums.USER],
    disabled: false,
  },
];
