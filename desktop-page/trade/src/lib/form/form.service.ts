import { Injectable } from '@angular/core';
import {
	StockPosition,
	StockPositionAction,
	StockPositionActionEntry,
	StockPositionActionTarget,
	StockPositionIdeaEntry,
} from 'types/position';
import {
	TradeOperation,
	TradeOperations,
	TradeOrder,
	TradeOrders,
	TradeOrderType,
	TradeOrderTypeDescription,
	TradePosition,
	TradeSource,
	TradeStopOrder,
	TradeStopOrders,
} from '@data-access-trade/types';
import { sortNumber } from 'utils/sort-number';
import { ActualTradeOperation, ActualTradeOperations } from './form.types';
import { getNumberPrecision } from 'utils/get-number-precision';
import {
	TRADE_ORDER_TYPE_BESTPRICE,
	TRADE_ORDER_TYPE_LIMIT,
	TRADE_ORDER_TYPE_MARKET,
	TRADE_STOP_ORDER_TYPE_STOP_LIMIT,
	TRADE_STOP_ORDER_TYPE_STOP_LOSS,
} from '@data-access-trade/order.constants';
import { TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL } from '../request/request.constants';
import { TradeStopOrderTypeText } from '@data-access-trade/order.types';
import { WithLastPrice } from 'types/stock';
import { getPriceIncrement } from 'utils/get-price-increment';
import { TradeCoreJournal, TradeJournal, TradeJournalStatus } from 'types/trade';
import { StockPositionType } from 'types/stock-position-type';

@Injectable()
export class TradeFormService {
	getOperationType(direction: boolean): 15 | 22 {
		return direction ? 15 : 22;
	}

	getDirectionFromOperation(type: 15 | 22 | number): boolean {
		return type === 15;
	}

	getDefaultControlValue(position: StockPosition, positionType: 'direct' | 'reverse' = 'direct'): TradeCoreJournal {
		const direction = position.idea.positionType === StockPositionType.LONG;
		const minPriceIncrement = position.idea.instrument.minPriceIncrement;

		return {
			ideaId: position.idea.id || 0,
			externalId: null,
			ideaDate: null,
			orderId: null,
			lots: 0,
			price: 0,
			quantity: 0,
			total: 0,
			status: null,
			expireDate: null,
			expirationType: TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL.id,
			instrumentId: position.idea.instrument.id,
			commission: 0,
			direction: positionType === 'direct' ? direction : !direction,
			lot: position.idea.instrument.lot,
			stopPrice: null,
			trailingIndent: 1,
			trailingIndentType: 1,
			trailingSpread: getNumberPrecision(minPriceIncrement * 3, getPriceIncrement(minPriceIncrement)),
			trailingSpreadType: 1,
		};
	}

	/**
	 * Отфильтровываем операции по дате, сначала по минимальной дате из journal ideaDate, если нет, то по position createdAt
	 * */
	getActualOperations(
		position: StockPosition,
		operations: TradeOperations,
		journal: TradeJournal[]
	): ActualTradeOperations {
		const dateValueOf = Math.min(
			...journal
				.filter((item: TradeJournal) => item.ideaDate !== null)
				.map((item: TradeJournal): number => {
					if (!item.ideaDate) {
						return 0;
					}
					return new Date(item.ideaDate).valueOf();
				})
		);

		if (dateValueOf === Infinity) {
			return [];
		}

		// if (position.idea.createdAt && dateValueOf === null) {
		// 	const createAt = new Date(position.idea.createdAt).valueOf();
		// 	if (!Number.isNaN(createAt)) {
		// 		dateValueOf = createAt;
		// 	}
		// }

		const actualOperations = dateValueOf
			? operations.filter((item: TradeOperation) => new Date(item.date).valueOf() > dateValueOf)
			: operations;

		return actualOperations.map((item: TradeOperation) => ({
			...item,
			lots: Math.floor(item.quantity / position.idea.instrument.lot),
		}));
	}

	/**
	 * Фильтр операций, которых ещё нет в сделке
	 * */
	getFilteredOperations(
		lotsInPosition: { lots: number; date: string | null }[],
		operations: ActualTradeOperations,
		operationType: 15 | 22
	): ActualTradeOperations {
		return operations
			.filter((item: ActualTradeOperation) => item.type === operationType && item.state === 1)
			.filter((item: ActualTradeOperation) => {
				if (lotsInPosition.length === 0) {
					return true;
				}

				const findIndex = lotsInPosition.findIndex((itemLots: { lots: number; date: string | null }) => {
					if (itemLots.lots === item.lots) {
						if (itemLots.date && item.date) {
							return new Date(itemLots.date).valueOf() === new Date(item.date).valueOf();
						}
					}

					return false;
				});

				if (findIndex !== -1) {
					lotsInPosition[findIndex].lots = -1;
				}

				return findIndex === -1;
			});
	}

	getIdeaControlValue(
		position: StockPosition,
		filter: { lastPrice: WithLastPrice; source: TradeSource },
		limit: number | null = null
	): TradeJournal[] {
		const { lastPrice } = filter;
		const defaultItem = this.getDefaultControlValue(position);
		const precision = getPriceIncrement(position.idea.instrument.minPriceIncrement) === 8 ? 8 : 0;
		const limitItem = limit && position.idea.entries.length ? limit / position.idea.entries.length : limit;

		return position.idea.entries.reduce((acc: TradeJournal[], item) => {
			const lots = this._getEntryLot(item, defaultItem.lot, precision, limitItem);

			const percent = this._getPriceToTarget(lastPrice.last, item.price);
			const order = this._getOrderType(percent === null ? 1 : percent);

			acc.push({
				...defaultItem,
				id: 0,
				sourceId: 0,
				accountId: '',
				price: item.price,
				commission: 0,
				quantity: lots * defaultItem.lot,
				lots,
				total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
				orderType: order.id,
				orderTypeText: order.type,
				status: TradeJournalStatus.UNLOADING,
			});

			return acc;
		}, []);
	}

	getPositionControlValue(
		accountId: string,
		source: TradeSource,
		position: StockPosition,
		portfolio: TradePosition | null,
		operationsDirection: ActualTradeOperations,
		positionType: 'direct' | 'reverse' = 'direct'
	): TradeJournal[] {
		if (portfolio) {
			const defaultItem = this.getDefaultControlValue(position, positionType);
			const direction = portfolio.quantity > 0;
			const precisionAmount = getPriceIncrement(position.idea.instrument.minPriceIncrement) === 8 ? 8 : 0;
			const quantity = Math.abs(portfolio.quantity);
			const lots = this._getLot(quantity / defaultItem.lot, precisionAmount);
			const findOperation =
				operationsDirection.find((operation: ActualTradeOperation) => {
					return operation.lots === lots;
				}) || null;

			return [
				{
					...defaultItem,
					accountId,
					sourceId: source.id,
					id: 0,
					direction,
					orderType: TRADE_ORDER_TYPE_LIMIT.id,
					orderTypeText: TRADE_ORDER_TYPE_LIMIT.type,
					price: portfolio.averagePositionPrice.value,
					quantity: quantity,
					commission: findOperation && findOperation.comission ? Math.abs(findOperation.comission.value) : 0,
					lots,
					total: getNumberPrecision(portfolio.averagePositionPrice.value * quantity, 2),
					status: TradeJournalStatus.EXECUTED,
				},
			];
		}

		return [];
	}

	getExecutedControlValue(
		accountId: string,
		source: TradeSource,
		position: StockPosition,
		list: StockPositionAction[],
		operationsDirection: ActualTradeOperations,
		positionType: 'direct' | 'reverse' = 'direct'
	): TradeJournal[] {
		const defaultItem = this.getDefaultControlValue(position, positionType);
		const precision = getPriceIncrement(position.idea.instrument.minPriceIncrement) === 8 ? 8 : 0;

		return list
			.filter((item: StockPositionAction) => item.brokerId === source.id)
			.map((item: StockPositionAction): TradeJournal => {
				const lots = this._getLot(item.amount / defaultItem.lot, precision);

				const findOperation =
					operationsDirection.find((operation: ActualTradeOperation) => {
						return operation.lots === lots;
					}) || null;

				return {
					...defaultItem,
					accountId,
					sourceId: source.id,
					id: 0,
					price: item.price,
					quantity: item.amount,
					orderType: TRADE_ORDER_TYPE_LIMIT.id,
					orderTypeText: TRADE_ORDER_TYPE_LIMIT.type,
					commission: findOperation && findOperation.comission ? Math.abs(findOperation.comission.value) : 0,
					lots,
					total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
					status: TradeJournalStatus.EXECUTED,
				};
			});
	}

	getAwaitsControlValue(
		accountId: string,
		source: TradeSource,
		position: StockPosition,
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		positionType: 'direct' | 'reverse' = 'direct'
	): TradeJournal[] {
		const defaultItem = this.getDefaultControlValue(position, positionType);

		/**
		 * Все отфильтрованные по направлению лимитные заявки
		 * */
		const orderControlValues: TradeJournal[] = orders
			.filter((item: TradeOrder) => +item.direction === +defaultItem.direction)
			.map((item: TradeOrder) => {
				return {
					...defaultItem,
					accountId,
					sourceId: source.id,
					externalId: item.orderRequestId,
					orderId: item.orderId,
					id: 0,
					price: item.initialSecurityPrice.value,
					quantity: item.lotsRequested * defaultItem.lot,
					lots: item.lotsRequested,
					orderType: item.orderType,
					orderTypeText: item.orderTypeText,
					commission: item.initialCommission ? item.initialCommission.value : 0,
					total: getNumberPrecision(item.initialSecurityPrice.value * item.lotsRequested * defaultItem.lot, 2),
					status: TradeJournalStatus.AWAITS,
				};
			});

		/**
		 * Все отфильтрованные по направлению стоп заявки
		 * */
		const stopOrderControlValues: TradeJournal[] = stopOrders
			.filter(
				(item: TradeStopOrder) =>
					+item.direction === +defaultItem.direction &&
					item.orderTypeText !== TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS
			)
			.map((item: TradeStopOrder) => {
				return {
					...defaultItem,
					accountId,
					externalId: item.stopOrderId,
					orderId: item.stopOrderId,
					sourceId: source.id,
					id: 0,
					price: item.price.value,
					quantity: item.lotsRequested * defaultItem.lot,
					lots: item.lotsRequested,
					orderType: item.orderType,
					orderTypeText: item.orderTypeText,
					stopPrice: item.stopPrice.value,
					trailingData: item.trailingData,
					total: getNumberPrecision(item.price.value * item.lotsRequested * defaultItem.lot, 2),
					status: TradeJournalStatus.AWAITS,
				};
			});

		return [...orderControlValues, ...stopOrderControlValues];
	}

	getUnloadingControlValue(
		accountId: string,
		source: TradeSource,
		position: StockPosition,
		list: { price: number; lots: number }[],
		orderType: TradeOrderTypeDescription,
		positionType: 'direct' | 'reverse' = 'direct'
	): TradeJournal[] {
		const defaultItem = this.getDefaultControlValue(position, positionType);

		return list.reduce((acc: TradeJournal[], item: { price: number; lots: number }) => {
			acc.push({
				...defaultItem,
				accountId,
				sourceId: source.id,
				id: 0,
				price: item.price,
				stopPrice: this.isOrderFamily(orderType) ? null : item.price,
				commission: 0,
				quantity: item.lots * defaultItem.lot,
				lots: item.lots,
				total: getNumberPrecision(item.price * item.lots * defaultItem.lot, 2),
				orderType: orderType.id,
				orderTypeText: orderType.type,
				status: null,
			});

			return acc;
		}, []);
	}

	getOrdersControlValue(
		accountId: string,
		source: TradeSource,
		position: StockPosition,
		orders: TradeOrders
	): TradeJournal[] {
		const defaultItem = this.getDefaultControlValue(position);

		return orders.map((item: TradeOrder) => ({
			...defaultItem,
			accountId,
			sourceId: source.id,
			direction: Boolean(item.direction),
			externalId: item.orderRequestId,
			id: 0,
			price: item.initialSecurityPrice.value,
			quantity: item.lotsRequested * defaultItem.lot,
			lots: item.lotsRequested,
			orderType: item.orderType,
			orderTypeText: item.orderTypeText,
			commission: item.initialCommission ? item.initialCommission.value : 0,
			total: getNumberPrecision(item.initialSecurityPrice.value * item.lotsRequested * defaultItem.lot, 2),
			status: TradeJournalStatus.AWAITS,
		}));
	}

	getStopOrdersControlValue(
		accountId: string,
		source: TradeSource,
		position: StockPosition,
		stopOrders: TradeStopOrders
	): TradeJournal[] {
		const defaultItem = this.getDefaultControlValue(position);

		return stopOrders.map((item: TradeStopOrder) => ({
			...defaultItem,
			accountId,
			sourceId: source.id,
			externalId: item.stopOrderId,
			id: 0,
			direction: Boolean(item.direction),
			price: item.price.value,
			quantity: item.lotsRequested * defaultItem.lot,
			lots: item.lotsRequested,
			orderType: item.orderType,
			orderTypeText: item.orderTypeText,
			total: getNumberPrecision(item.price.value * item.lotsRequested * defaultItem.lot, 2),
			status: TradeJournalStatus.AWAITS,
		}));
	}

	getOperationsControlValue(
		accountId: string,
		source: TradeSource,
		position: StockPosition,
		operations: ActualTradeOperations
	): TradeJournal[] {
		const defaultItem = this.getDefaultControlValue(position);

		return operations.map((item: ActualTradeOperation) => {
			return {
				...defaultItem,
				accountId,
				sourceId: source.id,
				id: 0,
				direction: this.getDirectionFromOperation(item.type),
				price: item.price.value,
				quantity: item.quantity,
				orderType: TRADE_ORDER_TYPE_LIMIT.id,
				orderTypeText: TRADE_ORDER_TYPE_LIMIT.type,
				commission: Math.abs(item.comission.value),
				lots: item.lots,
				total: getNumberPrecision(item.price.value * item.lots * defaultItem.lot, 2),
				status: TradeJournalStatus.EXECUTED,
			};
		});
	}

	getStopLossControlValue(
		position: StockPosition,
		maxLots: number,
		temp: TradeJournal[],
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operations: ActualTradeOperations
	): {
		orders: TradeJournal[];
		actions: TradeJournal[];
		ideas: TradeJournal[];
	} {
		const ideas = this.getIdeaStopLossControlValue(position, maxLots, temp);

		const outLots = position.actions.outs.reduce(
			(acc: number, item: StockPositionActionTarget) => (acc += item.amount),
			0
		);

		const defaultItem = this.getDefaultControlValue(position, 'reverse');
		const precision = position.idea.instrument.source === 'tinkoff' ? 0 : 8;
		const lots = getNumberPrecision(
			outLots === 0 ? maxLots : position.idea.inPositionQuantity / defaultItem.lot,
			precision
		);

		const brokerStopOrder = stopOrders
			.filter(
				(item: TradeStopOrder) =>
					item.direction === defaultItem.direction &&
					(item.orderTypeText === TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS ||
						item.orderTypeText === TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LIMIT)
			)
			.map((item: TradeStopOrder): TradeJournal & { disabled: boolean } => {
				return {
					...defaultItem,
					accountId: '',
					sourceId: 0,
					externalId: '',
					id: +item.stopOrderId,
					disabled: false,
					price: item.price.value,
					lots: item.lotsRequested,
					quantity: getNumberPrecision(item.lotsRequested * defaultItem.lot, precision),
					total: getNumberPrecision(item.stopPrice.value * item.lotsRequested * defaultItem.lot, 2),
					commission: 0,
					stopPrice: item.stopPrice.value,
					orderType: item.orderType,
					orderTypeText: item.orderTypeText,
					status: TradeJournalStatus.AWAITS,
				};
			});

		const brokerOrder = orders
			.filter((item: TradeOrder) => !!item.direction === defaultItem.direction && item.lotsRequested === lots)
			.map((item: TradeOrder): TradeJournal & { disabled: boolean } => ({
				...defaultItem,
				sourceId: 0,
				accountId: '',
				externalId: '',
				id: +item.orderId,
				disabled: false,
				price: item.initialSecurityPrice.value,
				lots: item.lotsRequested,
				quantity: getNumberPrecision(item.lotsRequested * defaultItem.lot, precision),
				total: getNumberPrecision(item.initialSecurityPrice.value * item.lotsRequested * defaultItem.lot, 2),
				commission: 0,
				stopPrice: item.initialSecurityPrice.value,
				orderType: item.orderType,
				orderTypeText: item.orderTypeText,
				status: TradeJournalStatus.AWAITS,
			}));

		return {
			ideas,
			orders: [...brokerStopOrder, ...brokerOrder],
			actions: [],
		};
	}

	getIdeaStopLossControlValue(
		position: StockPosition,
		maxLots: number,
		temp: TradeJournal[]
	): (TradeJournal & { disabled: boolean })[] {
		let stopPrice = 0;

		if (position.idea.stop) {
			stopPrice = position.idea.stop.price;
		}

		if (temp[0]) {
			stopPrice = temp[0].price;
		}

		if (stopPrice === 0) {
			return [];
		}

		const entryLots = position.actions.entries.reduce(
			(acc: number, item: StockPositionActionEntry) => (acc += item.amount),
			0
		);
		const outLots = position.actions.outs.reduce(
			(acc: number, item: StockPositionActionTarget) => (acc += item.amount),
			0
		);

		if (entryLots === outLots && entryLots !== 0) {
			return [];
		}

		if (maxLots === outLots && maxLots !== 0) {
			return [];
		}

		const defaultItem = this.getDefaultControlValue(position, 'reverse');
		const precision = position.idea.instrument.source === 'tinkoff' ? 0 : 8;
		const lots = getNumberPrecision(
			outLots === 0 || position.idea.inPositionQuantity < 0 ? maxLots : position.idea.inPositionQuantity / defaultItem.lot,
			precision
		);

		return [
			{
				...defaultItem,
				accountId: '',
				sourceId: 0,
				externalId: '',
				id: 0,
				disabled: false,
				price: stopPrice,
				lots: lots,
				quantity: getNumberPrecision(lots * defaultItem.lot, precision),
				total: getNumberPrecision(stopPrice * lots * defaultItem.lot, 2),
				commission: 0,
				stopPrice: stopPrice,
				orderType: TRADE_STOP_ORDER_TYPE_STOP_LOSS.id,
				orderTypeText: TRADE_STOP_ORDER_TYPE_STOP_LOSS.type,
				status: TradeJournalStatus.UNLOADING,
			},
		];
	}

	updateIdeaFromJournal(position: StockPosition, journal: TradeJournal[]) {
		const entries = this.getEntryFromJournal(position, journal);
		const outs = this.getOutFromJournal(position, journal);

		return {
			actions: {
				entries: [
					...entries.map((item: TradeJournal) => ({
						amount: item.quantity,
						date: item.expireDate || (item.ideaDate as string),
						brokerId: 1,
						price: item.price,
					})),
				].sort((a: { date: string }, b: { date: string }) =>
					sortNumber(new Date(b.date).valueOf(), new Date(a.date).valueOf())
				),
				outs: [
					...outs.map((item: TradeJournal) => ({
						amount: item.quantity,
						date: item.expireDate || (item.ideaDate as string),
						brokerId: 1,
						price: item.price,
					})),
				].sort((a: { date: string }, b: { date: string }) =>
					sortNumber(new Date(b.date).valueOf(), new Date(a.date).valueOf())
				),
			},
			dividends: position.dividends.map((item: any) => ({
				amount: item.amount,
				brokerId: item.brokerId,
				date: item.date,
				size: item.size,
			})),
			comissions: [
				...journal
					.filter((item: TradeJournal) => item.commission !== 0 && item.commission !== null)
					.map((item: TradeJournal) => ({
						brokerId: item.sourceId,
						date: item.expireDate || (item.ideaDate as string),
						size: item.commission,
					})),
			],
			idea: {
				goals: position.idea.targets.map((item: any) => ({
					amount: item.amount,
					goal: item.price,
				})),
				instrumentId: position.idea.instrument.id,
				parentId: position.idea.parentId,
				portfolioId: position.idea.portfolioId,
				positionType: position.idea.positionType,
				strategyId: position.idea.strategy!.id,
				amount: position.idea.entries.reduce((acc, item) => (acc += item.quantity), 0),
				entry: position.idea.entries[0] ? position.idea.entries[0].price : null,
				stop: position.idea.stop ? position.idea.stop.price : null,
				watch: true,
			},
		};
	}

	private _getPriceToTarget(lastPrice: number, price: number | null): number | null {
		if (price === null) {
			return null;
		}

		return Math.abs(((lastPrice - price) / price) * 100);
	}

	private _getOrderType(percent: number): TradeOrderType {
		return percent <= 0.5 ? TRADE_ORDER_TYPE_MARKET : TRADE_ORDER_TYPE_LIMIT;
	}

	/**
	 * Если акции, округляем до целого вниз, если крипта - округление до 8ми знаков
	 * */
	private _getLot(lot: number, precision: number): number {
		if (precision === 0) {
			return Math.floor(lot);
		}

		return getNumberPrecision(lot, precision);
	}

	private _getEntryLot(item: StockPositionIdeaEntry, lot: number, precision: number, limit: number | null): number {
		let lots = item.quantity / lot;

		if (limit !== null) {
			lots = limit / item.price / lot;
		}

		return this._getLot(lots, precision);
	}

	/**
	 * Необходмо для поиска заявок, мутирует входной массив
	 * */
	private _findOrders(orders: { lotsRequested: number }[], lots: number): boolean {
		if (orders.length > 0) {
			const findIndexOrder = orders.findIndex((orderItem: { lotsRequested: number }) => {
				return orderItem.lotsRequested === lots;
			});

			if (findIndexOrder !== -1) {
				orders[findIndexOrder].lotsRequested = -1;
				return true;
			}
		}

		return false;
	}

	isOrderFamily(order: TradeOrderType): boolean {
		return (
			[TRADE_ORDER_TYPE_LIMIT, TRADE_ORDER_TYPE_MARKET, TRADE_ORDER_TYPE_BESTPRICE].findIndex(
				(item) => item.type === order.type
			) !== -1
		);
	}

	isMayBeOrderStop(type: string): boolean {
		return (
			[TRADE_STOP_ORDER_TYPE_STOP_LOSS, TRADE_STOP_ORDER_TYPE_STOP_LIMIT].findIndex((item) => item.type === type) !== -1
		);
	}

	getEntryFromJournal(position: StockPosition, journal: TradeJournal[]): TradeJournal[] {
		const direction = position.idea.positionType === StockPositionType.LONG;
		return journal.filter((item: TradeJournal) => item.direction === direction);
	}

	getOutFromJournal(position: StockPosition, journal: TradeJournal[]): TradeJournal[] {
		const direction = position.idea.positionType === StockPositionType.LONG;
		return journal.filter(
			(item: TradeJournal) =>
				item.direction !== direction && item.price !== null && !this.isMayBeOrderStop(item.orderTypeText)
		);
	}

	getStopFromJournal(position: StockPosition, journal: TradeJournal[]): TradeJournal[] {
		const direction = position.idea.positionType === StockPositionType.LONG;
		return journal.filter(
			(item: TradeJournal) => item.direction !== direction && this.isMayBeOrderStop(item.orderTypeText)
		);
	}
}
