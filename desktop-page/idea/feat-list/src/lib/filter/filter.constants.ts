import { IdeaListFilterEnums } from './filter.enums';

export const IDEA_LIST_FILTER_CONSTANTS: { [key in IdeaListFilterEnums]: string } = {
  [IdeaListFilterEnums.TITLE]: 'Идеи',
  [IdeaListFilterEnums.ADD_IDEA]: 'Новая идея',
  [IdeaListFilterEnums.SEARCH]: 'Поиск',
  [IdeaListFilterEnums.TYPE]: 'Актив',
  [IdeaListFilterEnums.STRATEGY]: 'Стратегия',
  [IdeaListFilterEnums.CURRENCY]: 'Валюта',
  [IdeaListFilterEnums.FILTER]: 'Фильтр',
};
