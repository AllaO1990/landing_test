import { DealListFilterEnums } from './filter.enums';
import { AccountDealTypes } from 'types/account';

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
	[DealListFilterEnums.DEAL]: 'Тип сделки',
	[DealListFilterEnums.RANGE]: 'Период',
};

export const DEAL_TYPES: AccountDealTypes = [
	{ name: 'Все', id: null },
	{ name: 'Открытые', id: 'open' },
	{ name: 'Закрытые', id: 'closed' },
];
