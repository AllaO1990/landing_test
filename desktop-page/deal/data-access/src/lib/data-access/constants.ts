import { DealEnums } from './enums';

export const DEAL_CONSTANTS: { [key in DealEnums]: string } = {
  [DealEnums.TITLE]: 'Сделка',
  [DealEnums.ADD_DEAL]: 'Новая сделка',
  [DealEnums.SEARCH]: 'Поиск',
  [DealEnums.TYPE]: 'Актив',
  [DealEnums.STRATEGY]: 'Стратегия',
  [DealEnums.CURRENCY]: 'Валюта',
  [DealEnums.FILTER]: 'Фильтр',
  [DealEnums.BUTTON_ACTION]: 'Выйти',
  [DealEnums.DEAL]: 'Сделка',
  [DealEnums.BROKER]: 'Брокер',
};
