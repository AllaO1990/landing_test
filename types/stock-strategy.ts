export enum StockStrategy {
  CONSOLIDATION = 'consolidation',
  ACTIVE_ZONE = 'activeZone',
  SLIDING = 'sliding',
  USER = 'user',
}

export const StockStrategyDirectory: { [key in StockStrategy]: string } = {
  [StockStrategy.CONSOLIDATION]: 'Консолидация',
  [StockStrategy.ACTIVE_ZONE]: 'Активная зона',
  [StockStrategy.SLIDING]: 'Скользящие',
  [StockStrategy.USER]: 'Пользователь',
};
