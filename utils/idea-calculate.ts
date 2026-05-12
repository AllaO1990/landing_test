import {StockPositionIdeaEntry, StockPositionStop, StockPositionTarget} from '../types/position';
import {getNumberPrecision} from './get-number-precision';
import {getPriceIncrement} from './get-price-increment';
import {StockPositionDirection} from '../types/stock';

export const calculateEntries = (
	list: StockPositionIdeaEntry[],
	lot: number,
	minPriceIncrement: number,
	limit: number | null = null
): StockPositionIdeaEntry[] => {
	const total = list.reduce((acc: number, item: StockPositionIdeaEntry) => (acc += item.totalPrice), 0);
	const precisionAmount = getPriceIncrement(lot);

	if (limit === null || total <= limit || limit < list[0].price) {
		return list.map((item: StockPositionIdeaEntry) => {
			const quantity = getNumberPrecision(item.quantity, precisionAmount, 'floor');

			return {
				...item,
				quantity,
				totalPrice: getNumberPrecision(quantity * item.price, 2, 'floor'),
				lots: quantity / lot,
			};
		});
	}

	const lots = getNumberPrecision(limit / (list[0].price * lot), precisionAmount, 'floor');

	if (lots < 1 && precisionAmount === 0) {
		return list.map((item: StockPositionIdeaEntry) => ({
			...item,
			lots: item.quantity / lot,
		}));
	}

	return [
		{
			...list[0],
			lots,
			quantity: getNumberPrecision(lots * lot, precisionAmount, 'floor'),
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
	const multiplier = direction === StockPositionDirection.LONG ? 1 : -1;
	const totalEntry = entries.reduce(
		(acc: { total: number; quantity: number }, item: StockPositionIdeaEntry) => {
			acc.total += item.totalPrice;
			acc.quantity += item.quantity;

			return acc;
		},
		{ total: 0, quantity: 0 }
	);
	const totalEntryLots = totalEntry.quantity / lot;
	const precisionPrice = getPriceIncrement(minPriceIncrement);
	const precisionQuantity = getPriceIncrement(lot);
	const averagePrice = getNumberPrecision(totalEntry.total / totalEntry.quantity, precisionPrice);
	const targetsPrice: number[] =
		targets.length > 0
			? targets.map((item: StockPositionTarget): number => item.price)
			: atrList.map((multiply: number): number => averagePrice + multiply * atr * multiplier);

	let calcQuantity = 0;
	let rateIndex = 0;

	if (totalEntryLots < 4) {
		rateIndex = totalEntryLots;
	}

	return rate[rateIndex].reduce((acc: StockPositionTarget[], part: number, index: number, array) => {
		let quantity = getNumberPrecision(totalEntry.quantity - calcQuantity, precisionQuantity, 'floor');

		if (index !== array.length - 1) {
			quantity = getNumberPrecision(totalEntry.quantity * part, precisionQuantity, 'floor');
		}

		if (totalEntry.quantity - calcQuantity - quantity === 0 && index !== array.length - 1) {
			console.error('calculateTargets, last var: lots = 1;');
		}

		// if (totalEntryLots - calcLots - lots === 0 && index !== array.length - 1) {
		// 	lots = 1;
		// }

		const currentPrice = targetsPrice[index];
		const lots = getNumberPrecision(quantity / lot, precisionQuantity, 'floor');

		acc.push({
			price: currentPrice,
			amount: quantity,
			lots: lots,
			profit: getNumberPrecision((currentPrice - averagePrice) * quantity * multiplier, precisionPrice),
			profitPercent: getNumberPrecision(100 * ((currentPrice - averagePrice) / averagePrice) * multiplier, 2),
			depositShare: null,
			totalPrice: getNumberPrecision(currentPrice * quantity, precisionPrice),
			reached: false,
			stopDate: null,
			brokerId: null,
		});

		calcQuantity += getNumberPrecision(quantity, precisionQuantity, 'floor');

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

	const multiplier = direction === StockPositionDirection.LONG ? -1 : 1;
	const precisionPrice = getPriceIncrement(minPriceIncrement);
	const precisionQuantity = getPriceIncrement(lot);
	const totalEntry = entries.reduce(
		(acc, item: StockPositionIdeaEntry) => {
			acc.total += item.totalPrice;
			acc.quantity += item.quantity;

			return acc;
		},
		{ total: 0, quantity: 0 }
	);
	const averagePrice = getNumberPrecision(totalEntry.total / totalEntry.quantity, precisionPrice);
	const price = stop.length !== 0 ? stop[0].price : averagePrice + atr * multiplier;

	return [
		{
			price,
			lots: getNumberPrecision(totalEntry.quantity / lot, precisionQuantity),
			amount: totalEntry.quantity,
			totalPrice: getNumberPrecision(price * totalEntry.quantity, 2),
			loss: getNumberPrecision((price - averagePrice) * totalEntry.quantity * multiplier * -1, precisionPrice),
			lossPercent: getNumberPrecision(100 * ((price - averagePrice) / averagePrice) * multiplier * -1, 2),
			depositShare: null,
			stopCandleDate: null,
			amountPercent: 100,
		},
	];
};

export const transformEntries = (list: StockPositionIdeaEntry[], lot: number) => {
	return list.map((item: StockPositionIdeaEntry) => ({
		...item,
		lots: item.quantity / lot,
		totalPrice: getNumberPrecision(item.price * item.quantity, 2, 'floor'),
	}));
};

export const transformTargets = (list: StockPositionTarget[], lot: number): StockPositionTarget[] => {
	return list.map((item) => {
		return {
			...item,
			lots: item.amount / lot,
			totalPrice: getNumberPrecision(item.price * item.amount, 2),
			depositShare: null,
			brokerId: null,
		};
	});
};
