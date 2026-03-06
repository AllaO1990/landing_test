import { PortfolioEnums } from './enums';

export const PORTFOLIO_CONSTANTS: { [key in PortfolioEnums]: string } = {
	[PortfolioEnums.TITLE]: 'Портфель',
	[PortfolioEnums.PORTFOLIO]: 'Портфель',
	[PortfolioEnums.CURRENCY]: 'Валюта',
	[PortfolioEnums.VALUE]: 'Стоимость',
	[PortfolioEnums.PROFIT]: 'Прибыль',
	[PortfolioEnums.SPARE]: 'Свободные средства',
	[PortfolioEnums.CHART]: 'График',
	[PortfolioEnums.DEAL]: 'Тип сделки',
	[PortfolioEnums.TYPE]: 'Актив',
	[PortfolioEnums.STRATEGY]: 'Стратегия',
	[PortfolioEnums.BROKER]: 'Брокер',
	[PortfolioEnums.RANGE]: 'Период',
	[PortfolioEnums.FILTER]: 'Фильтр',
};
