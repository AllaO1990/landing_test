import { StockPositionIdeaEntry, StockPositionStop, StockPositionTarget } from 'types/position';
import { getNumberPrecision } from 'utils/get-number-precision';
import { getPriceIncrement } from 'utils/get-price-increment';

export const calculateEntries = (
	list: StockPositionIdeaEntry[],
	lot: number,
	minPriceIncrement: number,
	limit: number | null = null
): StockPositionIdeaEntry[] => {
	const total = list.reduce((acc: number, item: StockPositionIdeaEntry) => (acc += item.totalPrice), 0);

	if (limit === null || total <= limit) {
		return list.map((item: StockPositionIdeaEntry) => ({
			...item,
			lots: item.quantity / lot,
		}));
	}

	const precisionAmount = getPriceIncrement(minPriceIncrement) === 8 ? 8 : 0;
	const lots = getNumberPrecision(limit / (list[0].price * lot), precisionAmount, 'floor');

	return [
		{
			...list[0],
			lots,
			quantity: lots * lot,
			totalPrice: getNumberPrecision(list[0].price * lot * lots, 2, 'floor'),
		},
	];
};

export const calculateTargets = (
	direction: 'long' | 'short',
	targets: StockPositionTarget[],
	entries: StockPositionIdeaEntry[],
	lot: number,
	minPriceIncrement: number,
	atr = 0
): StockPositionTarget[] => {
	if (entries.length === 0) {
		return [];
	}

	const atrList: number[] = [1, 2, 4];
	const rate = [[0.4, 0.3, 0.3], [1], [0.5, 0.5], [0.33, 0.33, 0.33]];
	const multiplier = direction === 'long' ? 1 : -1;
	const totalEntry = entries.reduce(
		(acc: { total: number; quantity: number }, item: StockPositionIdeaEntry) => {
			acc.total += item.totalPrice;
			acc.quantity += item.quantity;

			return acc;
		},
		{ total: 0, quantity: 0 }
	);
	const totalEntryLots = totalEntry.quantity / lot;
	const precision = getPriceIncrement(minPriceIncrement);
	const precisionAmount = precision === 8 ? 8 : 0;
	const averagePrice = getNumberPrecision(totalEntry.total / totalEntry.quantity, precision);
	const targetsPrice: number[] =
		targets.length > 0
			? targets.map((item: StockPositionTarget): number => item.price)
			: atrList.map((multiply: number): number => averagePrice + multiply * atr * multiplier);

	let calcLots = 0;
	let rateIndex = 0;

	if (totalEntryLots < 4) {
		rateIndex = totalEntryLots;
	}

	return rate[rateIndex].reduce((acc: StockPositionTarget[], part: number, index: number, array) => {
		let lots = totalEntryLots - calcLots;

		if (index !== array.length - 1) {
			lots = getNumberPrecision(totalEntryLots * part, precisionAmount, 'ceil');
		}

		if (totalEntryLots - calcLots - lots === 0) {
			lots = 1;
		}

		const currentPrice = targetsPrice[index];
		const quantity = lots * lot;

		acc.push({
			price: currentPrice,
			amount: quantity,
			lots: lots,
			profit: getNumberPrecision((currentPrice - averagePrice) * quantity * multiplier, precision),
			profitPercent: getNumberPrecision(100 * ((currentPrice - averagePrice) / averagePrice) * multiplier, 2),
			depositShare: null,
			totalPrice: getNumberPrecision(currentPrice * quantity, precision),
			reached: false,
			stopDate: null,
			broker: null,
		});

		calcLots += lots;

		return acc;
	}, []);
};

export const calculateStop = (
	direction: 'long' | 'short',
	stop: StockPositionStop[],
	entries: StockPositionIdeaEntry[],
	lot: number,
	minPriceIncrement: number,
	atr = 0
): StockPositionStop[] => {
	if (entries.length === 0) {
		return [];
	}

	const multiplier = direction === 'long' ? -1 : 1;
	const precision = getPriceIncrement(minPriceIncrement);
	const totalEntry = entries.reduce(
		(acc, item: StockPositionIdeaEntry) => {
			acc.total += item.totalPrice;
			acc.quantity += item.quantity;

			return acc;
		},
		{ total: 0, quantity: 0 }
	);
	const averagePrice = getNumberPrecision(totalEntry.total / totalEntry.quantity, precision);
	const price = stop.length !== 0 ? stop[0].price : averagePrice + atr * multiplier;

	return [
		{
			price,
			lots: totalEntry.quantity / lot,
			amount: totalEntry.quantity,
			totalPrice: price * totalEntry.quantity,
			loss: getNumberPrecision((price - averagePrice) * totalEntry.quantity * multiplier, precision),
			lossPercent: getNumberPrecision(100 * ((price - averagePrice) / averagePrice) * multiplier, 2),
			depositShare: null,
			stopCandleDate: null,
			amountPercent: 100,
		},
	];
};
