import { DealListFilterEnums } from './filter.enums';

export const DELA_LIST_FILTER_CONSTANTS: { [key in DealListFilterEnums]: string } = {
  [DealListFilterEnums.TITLE]: 'Идеи',
  [DealListFilterEnums.ADD_IDEA]: 'Новая идея',
  [DealListFilterEnums.SEARCH]: 'Поиск',
  [DealListFilterEnums.TYPE]: 'Актив',
  [DealListFilterEnums.STRATEGY]: 'Стратегия',
  [DealListFilterEnums.CURRENCY]: 'Валюта',
  [DealListFilterEnums.FILTER]: 'Фильтр',
  [DealListFilterEnums.BROKER]: 'Брокер',
  [DealListFilterEnums.PORTFOLIO]: 'Портфель',
};
