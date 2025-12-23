import { ClosedDealsEnums } from './enums';

export const CLOSED_DEALS_CONSTANTS: { [key in ClosedDealsEnums]: string } = {
  [ClosedDealsEnums.TRANSACTION]: 'Тип сделки',
  [ClosedDealsEnums.SEARCH]: 'Поиск',
  [ClosedDealsEnums.ADD_IDEA]: '+ Новая сделка',
};
