import { Injectable } from '@angular/core';
import {
	StockPosition,
	StockPositionAction,
	StockPositionActionEntry,
	StockPositionActionTarget,
	StockPositionIdeaEntry,
	StockPositionTarget,
} from 'types/position';
import {
	TradeOperation,
	TradeOperations,
	TradeOrder,
	TradeOrders,
	TradeOrderType,
	TradeOrderTypeDescription,
	TradePortfolio,
	TradePosition,
	TradeSource,
	TradeStopOrder,
	TradeStopOrders,
} from '@data-access-trade/types';
import { sortNumber } from 'utils/sort-number';
import { ActualTradeOperation, ActualTradeOperations, ControlValue } from './form.types';
import { getNumberPrecision } from 'utils/get-number-precision';
import {
	TRADE_ORDER_TYPE_BESTPRICE,
	TRADE_ORDER_TYPE_LIMIT,
	TRADE_ORDER_TYPE_MARKET,
	TRADE_STOP_ORDER_TYPE_STOP_LIMIT,
	TRADE_STOP_ORDER_TYPE_STOP_LOSS,
	TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
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

	getActualOperations(position: StockPosition, operations: TradeOperations): ActualTradeOperations {
		const createAt = position.idea.createdAt && new Date(position.idea.createdAt).valueOf();
		const actualOperations = createAt
			? operations.filter((item: TradeOperation) => new Date(item.date).valueOf() > createAt)
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
			const precision = getPriceIncrement(position.idea.instrument.minPriceIncrement) === 8 ? 8 : 0;
			const lots = this._getLot(portfolio.quantity / defaultItem.lot, precision);
			const findOperation =
				operationsDirection.find((operation: ActualTradeOperation) => {
					return operation.lots === lots;
				}) || null;

			return [
				{
					...defaultItem,
					accountId,
					sourceId: source.id,
					externalId: '0',
					id: 0,
					orderType: TRADE_ORDER_TYPE_LIMIT.id,
					orderTypeText: TRADE_ORDER_TYPE_LIMIT.type,
					price: portfolio.averagePositionPrice.value,
					quantity: portfolio.quantity,
					commission: findOperation && findOperation.comission ? Math.abs(findOperation.comission.value) : 0,
					lots,
					total: getNumberPrecision(portfolio.averagePositionPrice.value * portfolio.quantity, 2),
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
					externalId: item.orderId,
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

	// getEntryControlValue(
	// 	position: StockPosition,
	// 	orders: TradeOrders,
	// 	stopOrders: TradeStopOrders,
	// 	operationsDirection: ActualTradeOperations,
	// 	filter: { lastPrice: WithLastPrice; source: TradeSource },
	// 	limit: number | null = null
	// ): {
	// 	orders: TradeControlValue[];
	// 	actions: TradeControlValue[];
	// 	ideas: TradeControlValue[];
	// } {
	// 	const { source } = filter;
	// 	const defaultItem = this.getDefaultControlValue(position);
	// 	const ordersDirection = orders.filter((item: TradeOrder) => +item.direction === +defaultItem.direction);
	// 	const stopOrdersDirection = stopOrders.filter((item: TradeStopOrder) => +item.direction === +defaultItem.direction);
	//
	// 	/**
	// 	 * Записаные в сделке входы
	// 	 * */
	// 	const executedControlValues: TradeControlValue[] = this.getExecutedControlValue(
	// 		position,
	// 		position.actions.entries,
	// 		source,
	// 		operationsDirection
	// 	);
	//
	// 	/**
	//    * Расскомментировать если в идее больше одного входа и часть входов находится с заявках
	//    const unloadingOrdersDirection = ordersDirection.map((item) => ({ ...item }));
	//    const unloadingStopOrdersDirection = stopOrdersDirection.map((item) => ({ ...item }));
	//    */
	//
	// 	/**
	// 	 * Входы из идеи
	// 	 */
	// 	let unloadingControlValues: TradeControlValue[] = [];
	//
	// 	if (ordersDirection.length === 0 && stopOrdersDirection.length === 0 && executedControlValues.length === 0) {
	// 		unloadingControlValues = this.getIdeaControlValue(position, filter, limit);
	// 	}
	//
	// 	const awaitsControlValues = this.getAwaitsControlValue(position, orders, stopOrders);
	//
	// 	return {
	// 		actions: executedControlValues,
	// 		ideas: unloadingControlValues,
	// 		orders: awaitsControlValues,
	// 	};
	// }

	getOutControlValue(
		position: StockPosition,
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operationsDirection: ActualTradeOperations,
		filter: { source: TradeSource },
		maxLots: number | null = null
	): {
		orders: TradeJournal[];
		actions: TradeJournal[];
		ideas: TradeJournal[];
	} {
		const { source } = filter;
		const defaultItem = this.getDefaultControlValue(position, 'reverse');
		const outs = position.actions.outs.filter((item: StockPositionActionTarget) => item.brokerId === source.id);
		const ordersDirection = orders.filter((item: TradeOrder) => +item.direction === +defaultItem.direction);
		const stopOrdersDirection = stopOrders.filter((item: TradeStopOrder) => +item.direction === +defaultItem.direction);
		const precision = getPriceIncrement(position.idea.instrument.minPriceIncrement) === 8 ? 8 : 0;

		/**
		 * Записаные в сделке выходы
		 * */
		const executedControlValues: TradeJournal[] = outs.map((item): TradeJournal => {
			const lots = this._getLot(item.amount / defaultItem.lot, precision);

			const findOperation = operationsDirection.find((operation: ActualTradeOperation) => operation.lots === lots) || null;

			return {
				...defaultItem,
				accountId: '',
				sourceId: 0,
				externalId: '',
				id: 0,
				price: item.price,
				stopPrice: item.price,
				lots,
				orderType: TRADE_STOP_ORDER_TYPE_TAKE_PROFIT.id,
				orderTypeText: TRADE_STOP_ORDER_TYPE_TAKE_PROFIT.type,
				commission: findOperation ? Math.abs(findOperation.comission.value) : 0,
				quantity: lots * defaultItem.lot,
				total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
				status: TradeJournalStatus.EXECUTED,
			};
		});

		const unloadingOrdersDirection = ordersDirection.map((item: TradeOrder) => ({ ...item }));
		const unloadingStopOrdersDirection = stopOrdersDirection.map((item: TradeStopOrder) => ({ ...item }));
		const getLotItem = this._getOutLot(position.idea.targets.length, defaultItem.lot, precision, maxLots);

		const unloadingControlValues: TradeJournal[] = position.idea.targets.reduce(
			(acc: TradeJournal[], item, index: number) => {
				const lots = getLotItem(item, index);

				if (lots === null) {
					return acc;
				}

				if (this._findOrders(unloadingOrdersDirection, lots)) {
					return acc;
				}

				if (this._findOrders(unloadingStopOrdersDirection, lots)) {
					return acc;
				}

				acc.push({
					...defaultItem,
					sourceId: 0,
					accountId: '',
					externalId: '',
					id: 0,
					price: item.price,
					stopPrice: item.price,
					commission: 0,
					lots,
					quantity: lots * defaultItem.lot,
					total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
					orderType: TRADE_STOP_ORDER_TYPE_TAKE_PROFIT.id,
					orderTypeText: TRADE_STOP_ORDER_TYPE_TAKE_PROFIT.type,
					status: TradeJournalStatus.UNLOADING,
				});

				return acc;
			},
			[]
		);

		const awaitsControlValues = this.getAwaitsControlValue('', source, position, orders, stopOrders, 'reverse');

		return {
			actions: executedControlValues,
			ideas: unloadingControlValues,
			orders: awaitsControlValues,
		};
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
					...position.actions.entries.map((item: any) => ({
						amount: item.amount,
						brokerId: item.brokerId,
						date: item.date,
						price: item.price,
					})),
					...entries.map((item: TradeJournal) => ({
						amount: item.quantity,
						date: item.expireDate,
						brokerId: 1,
						price: item.price,
					})),
				].sort((a: { date: string }, b: { date: string }) =>
					sortNumber(new Date(b.date).valueOf(), new Date(a.date).valueOf())
				),
				outs: [
					...position.actions.outs.map((item: any) => ({
						amount: item.amount,
						brokerId: item.brokerId,
						date: item.date,
						price: item.price,
					})),
					...outs.map((item: TradeJournal) => ({
						amount: item.quantity,
						date: item.expireDate,
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
				...position.comissions.map((item: any) => ({
					brokerId: item.brokerId,
					comment: item.comment,
					date: item.date,
					size: item.size,
				})),
				...journal
					.filter((item: TradeJournal) => item.commission !== 0 || item.commission !== null)
					.map((item: TradeJournal) => ({
						brokerId: 1,
						date: item.expireDate,
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

	updateIdea(position: StockPosition, entries: TradeOperations, outs: TradeOperations, commissions: TradeOperations) {
		return {
			actions: {
				entries: [
					...position.actions.entries.map((item: any) => ({
						amount: item.amount,
						brokerId: item.brokerId,
						date: item.date,
						price: item.price,
					})),
					...entries.map((item) => ({
						amount: item.quantity,
						date: item.date,
						brokerId: 1,
						price: item.price.value,
					})),
				].sort((a: { date: string }, b: { date: string }) =>
					sortNumber(new Date(b.date).valueOf(), new Date(a.date).valueOf())
				),
				outs: [
					...position.actions.outs.map((item: any) => ({
						amount: item.amount,
						brokerId: item.brokerId,
						date: item.date,
						price: item.price,
					})),
					...outs.map((item) => ({
						amount: item.quantity,
						date: item.date as string,
						brokerId: 1,
						price: item.price.value,
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
				...position.comissions.map((item: any) => ({
					brokerId: item.brokerId,
					comment: item.comment,
					date: item.date,
					size: item.size,
				})),
				...commissions
					.filter((item: any) => item.comission.value !== 0)
					.map((item: TradeOperation) => ({
						brokerId: 1,
						comment: item.description,
						date: item.date,
						size: Math.abs(item.comission.value),
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

	updatePositionIdea(
		position: StockPosition,
		entries: ControlValue[],
		targets: ControlValue[],
		stops: ControlValue[]
	): StockPosition {
		let stop = null;

		if (stops[0]) {
			stop = {
				depositShare: null,
				lossPercent: null,
				loss: null,
				price: stops[0].price,
				totalPrice: stops[0].total,
				stopCandleDate: null,
				amount: stops[0].quantity,
				lots: stops[0].lots,
				amountPercent: null,
			};
		}

		return {
			...position,
			idea: {
				...position.idea,
				entries: entries.map((item: ControlValue): any => ({
					date: null,
					depositShare: null,
					price: item.price,
					quantity: item.quantity,
					amount: item.quantity,
					totalPrice: item.total,
				})),
				targets: targets.map((item: ControlValue): any => ({
					profit: item.total,
					profitPercent: null,
					depositShare: null,
					reached: false,
					stopDate: null,
					amount: item.quantity,
					price: item.price,
				})),
				stop,
			},
		};
	}

	getCalcOutIdea(outIdea: ControlValue[], entryLots: number, priceIncrement: number): ControlValue[] {
		const precision = priceIncrement === 8 ? priceIncrement : 0;
		const ratio: number[][] = [[1], [0.6, 0.4], [0.4, 0.3, 0.3]];
		let enterLotsIndex = 2;
		let quantity = 0;

		if (entryLots <= 3) {
			enterLotsIndex = (entryLots % 2) + 1;
		}

		if (outIdea.length === 2) {
			enterLotsIndex = 1;
		}

		return ratio[enterLotsIndex].reduce((acc: ControlValue[], pct: number, index: number, array: number[]) => {
			if (!outIdea[index]) {
				return acc;
			}

			let amount = getNumberPrecision(entryLots * pct, precision);

			if (entryLots === 1) {
				if (index === 1) {
					amount = 1;
				} else {
					return acc;
				}
			}

			if (index === array.length - 1 || index === outIdea.length - 1) {
				amount = getNumberPrecision(entryLots - quantity, precision);

				if (amount === 0) {
					return acc;
				}
			}

			quantity += amount;

			const item = outIdea[index];

			acc.push({
				...item,
				lots: amount,
				quantity: getNumberPrecision(amount * item.lot, precision),
				total: getNumberPrecision(amount * item.lot * item.price, 2),
			});

			return acc;
		}, []);
	}

	getIdeaStopLossToStop(position: StockPosition): StockPosition {
		let stop = position.idea.stop;

		if (stop) {
			stop = {
				...stop,
				price: 0,
			};
		}

		return {
			...position,
			idea: {
				...position.idea,
				stop,
			},
		};
	}

	getIdeaStopLossToTarget(position: StockPosition): StockPosition {
		let stopPrice = position.idea.stop;

		if (position.actions.outs.length) {
			if (position.actions.outs.length === 1 && stopPrice) {
				stopPrice = {
					...stopPrice,
					price: position.actions.outs[0].price,
				};
			}
			if (position.actions.outs.length > 1 && stopPrice) {
				stopPrice = {
					...stopPrice,
					price: position.actions.outs[position.actions.outs.length - 2].price,
				};
			}
		}

		return {
			...position,
			idea: {
				...position.idea,
				stop: stopPrice,
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

	private _getOutLot(
		maxItems: number,
		lot: number,
		precision: number,
		maxLots: number | null
	): (item: StockPositionTarget, index: number) => number | null {
		if (maxLots === null) {
			return (item: StockPositionTarget, _: number) => this._getLot(item.amount / lot, precision);
		}

		const ratio: number[][] = [[0.4, 0.3, 0.3], [1], [0.6, 0.4]];
		let enterLotsIndex = 0;

		if (maxItems <= 3) {
			enterLotsIndex = maxItems % 3;
		}

		if (maxLots < maxItems && precision === 0) {
			enterLotsIndex = maxLots % 3;
		}

		return (_: StockPositionTarget, index: number) => {
			if (ratio[enterLotsIndex][index] === undefined) {
				return null;
			}

			if (maxItems - 1 === index) {
				return ratio[enterLotsIndex].reduce((acc: number, pct: number, currentIndex: number) => {
					if (currentIndex === index) {
						return acc;
					}

					return (acc -= getNumberPrecision(maxLots * pct, precision));
				}, maxLots);
			}

			return getNumberPrecision(maxLots * ratio[enterLotsIndex][index], precision);
		};
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

	private _getOrderById(id: number): TradeOrderType {
		return (
			[TRADE_ORDER_TYPE_LIMIT, TRADE_ORDER_TYPE_MARKET, TRADE_ORDER_TYPE_BESTPRICE].find((item) => item.id === id) ||
			TRADE_ORDER_TYPE_LIMIT
		);
	}

	private _getStopOrderById(id: number): TradeOrderType {
		return (
			[TRADE_STOP_ORDER_TYPE_TAKE_PROFIT, TRADE_STOP_ORDER_TYPE_STOP_LOSS, TRADE_STOP_ORDER_TYPE_STOP_LIMIT].find(
				(item) => item.id === id
			) || TRADE_STOP_ORDER_TYPE_TAKE_PROFIT
		);
	}

	private _getStopOrderByName(name: string): TradeOrderType | null {
		const list = [TRADE_STOP_ORDER_TYPE_STOP_LOSS, TRADE_STOP_ORDER_TYPE_STOP_LIMIT];

		return list.find((item: TradeOrderType) => item.type === name) || null;
	}

	getEntryPositionFromJournal(
		accountId: string,
		source: TradeSource,
		position: StockPosition,
		journal: TradeJournal[],
		portfolio: TradePortfolio
	): TradeJournal[] {
		const portfolioPosition = portfolio.positions[0];

		if (!portfolioPosition || portfolioPosition.quantity === 0) {
			return [];
		}

		const journalExecuted = journal.filter((item: TradeJournal) => item.status === TradeJournalStatus.EXECUTED);
		const quantityExecuted = journalExecuted.reduce((acc: number, item: TradeJournal) => acc + item.quantity, 0);

		if (quantityExecuted === Math.abs(portfolioPosition.quantity)) {
			return [];
		}

		const priceIncrement = getPriceIncrement(position.idea.instrument.minPriceIncrement);
		const precision = priceIncrement === 8 ? priceIncrement : 0;
		const totalExecuted = journalExecuted.reduce((acc: number, item: TradeJournal) => acc + item.total, 0);
		const quantityRemainder = Math.abs(portfolioPosition.quantity) - quantityExecuted;
		const totalRemainder = getNumberPrecision(
			Math.abs(portfolioPosition.quantity) * portfolioPosition.averagePositionPrice.value - totalExecuted,
			2
		);
		const priceRemainder = getNumberPrecision(totalRemainder / quantityRemainder, priceIncrement);

		return [
			{
				...this.getDefaultControlValue(position),
				accountId,
				sourceId: source.id,
				id: 0,
				total: totalRemainder,
				quantity: quantityRemainder,
				lots: getNumberPrecision(quantityRemainder / position.idea.instrument.lot, precision),
				price: priceRemainder,
				status: TradeJournalStatus.EXECUTED,
				orderType: TRADE_ORDER_TYPE_LIMIT.id,
				orderTypeText: TRADE_ORDER_TYPE_LIMIT.type,
			},
		];
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
			(item: TradeJournal) =>
				item.direction !== direction && item.stopPrice !== null && this.isMayBeOrderStop(item.orderTypeText)
		);
	}
}
