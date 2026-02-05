import { Injectable } from '@angular/core';
import {
	StockPosition,
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
	TradeSource,
	TradeStopOrder,
	TradeStopOrders,
} from '@data-access-trade/types';
import { sortNumber } from 'utils/sort-number';
import {
	ActualTradeOperation,
	ActualTradeOperations,
	ControlValue,
	ControlValueStatus,
	DefaultControlValue,
} from './form.types';
import { getNumberPrecision } from 'utils/get-number-precision';
import {
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

@Injectable()
export class TradeFormService {
	getOperationType(direction: boolean): 15 | 22 {
		return direction ? 15 : 22;
	}

	getDefaultControlValue(position: StockPosition, positionType: 'direct' | 'reverse' = 'direct'): DefaultControlValue {
		const direction = position.idea.positionType === 'long';
		const minPriceIncrement = position.idea.instrument.minPriceIncrement;

		return {
			removed: false,
			change: false,
			expireDate: null,
			expirationType: TRADE_STOP_ORDER_EXPIRATION_TYPE_GOOD_TILL_CANCEL,
			orderType: null,
			instrumentId: position.idea.instrument.id,
			commission: 0,
			direction: positionType === 'direct' ? direction : !direction,
			id: null,
			date: null,
			lot: position.idea.instrument.lot,
			stopPrice: null,
			trailingData: {
				indent: 1,
				indentType: 1,
				spread: getNumberPrecision(minPriceIncrement * 3, 2),
				spreadType: 1,
			},
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

	getEntryControlValue(
		position: StockPosition,
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operationsDirection: ActualTradeOperations,
		filter: { lastPrice: WithLastPrice; source: TradeSource },
		limit: number | null = null
	): {
		orders: ControlValue[];
		actions: ControlValue[];
		ideas: ControlValue[];
	} {
		const { lastPrice, source } = filter;
		const defaultItem = this.getDefaultControlValue(position);
		const entries = position.actions.entries.filter((item: StockPositionActionEntry) => item.brokerId === source.id);
		const ordersDirection = orders.filter((item: TradeOrder) => +item.direction === +defaultItem.direction);
		const stopOrdersDirection = stopOrders.filter((item: TradeStopOrder) => +item.direction === +defaultItem.direction);
		const limitItem = limit && position.idea.entries.length ? limit / position.idea.entries.length : limit;
		const precision = getPriceIncrement(position.idea.instrument.minPriceIncrement) === 8 ? 8 : 0;

		/**
		 * Записаные в сделке входы
		 * */
		const executedControlValues: ControlValue[] = entries.map((item): ControlValue => {
			const lots = this._getLot(item.amount / defaultItem.lot, precision);

			const findOperation =
				operationsDirection.find((operation: ActualTradeOperation) => {
					return operation.lots === lots;
				}) || null;

			return {
				...defaultItem,
				price: item.price,
				quantity: item.amount,
				commission: findOperation && findOperation.comission ? Math.abs(findOperation.comission.value) : 0,
				lots,
				total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
				status: ControlValueStatus.EXECUTED,
			};
		});

		/**
     * Расскомментировать если в идее больше одного входа и часть входов находится с заявках
     const unloadingOrdersDirection = ordersDirection.map((item) => ({ ...item }));
     const unloadingStopOrdersDirection = stopOrdersDirection.map((item) => ({ ...item }));
     */

		/**
		 * Входы из идеи
		 */
		let unloadingControlValues: ControlValue[] = [];

		if (ordersDirection.length === 0 && stopOrdersDirection.length === 0 && executedControlValues.length === 0) {
			unloadingControlValues = position.idea.entries.reduce((acc: ControlValue[], item) => {
				const lots = this._getEntryLot(item, defaultItem.lot, precision, limitItem);

				/**
         * Расскомментировать если в идее больше одного входа и часть входов находится с заявках
         if (this._findOrders(unloadingStopOrdersDirection, lots)) {
         return acc;
         }

         if (this._findOrders(unloadingOrdersDirection, lots)) {
         return acc;
         }
         */

				const percent = this._getPriceToTarget(lastPrice.last, item.price);

				acc.push({
					...defaultItem,
					price: item.price,
					commission: 0,
					quantity: lots * defaultItem.lot,
					lots,
					total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
					orderType: this._getOrderType(percent === null ? 1 : percent),
					status: ControlValueStatus.UNLOADING,
				});

				return acc;
			}, []);
		}

		/**
		 * Все отфильтрованные по направлению лимитные заявки
		 * */
		const orderControlValues: ControlValue[] = ordersDirection.map((item: TradeOrder) => ({
			...defaultItem,
			id: item.orderId,
			price: item.initialSecurityPrice.value,
			quantity: item.lotsRequested * defaultItem.lot,
			lots: item.lotsRequested,
			orderType: {
				id: item.orderType,
				type: item.orderTypeText,
			},
			commission: item.initialCommission ? item.initialCommission.value : 0,
			total: getNumberPrecision(item.initialSecurityPrice.value * item.lotsRequested * defaultItem.lot, 2),
			status: ControlValueStatus.AWAITS,
		}));

		/**
		 * Все отфильтрованные по направлению стоп заявки
		 * */
		const stopOrderControlValues: ControlValue[] = stopOrdersDirection.map((item: TradeStopOrder) => ({
			...defaultItem,
			id: item.stopOrderId,
			price: item.price.value,
			quantity: item.lotsRequested * defaultItem.lot,
			lots: item.lotsRequested,
			orderType: {
				id: item.orderType,
				type: item.orderTypeText,
			},
			stopPrice: item.stopPrice.value,
			trailingData: item.trailingData,
			total: getNumberPrecision(item.price.value * item.lotsRequested * defaultItem.lot, 2),
			status: ControlValueStatus.AWAITS,
		}));

		return {
			actions: executedControlValues,
			ideas: unloadingControlValues,
			orders: [...orderControlValues, ...stopOrderControlValues],
		};
	}

	getOutControlValue(
		position: StockPosition,
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operationsDirection: ActualTradeOperations,
		filter: { source: TradeSource },
		maxLots: number | null = null
	): {
		orders: ControlValue[];
		actions: ControlValue[];
		ideas: ControlValue[];
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
		const executedControlValues: ControlValue[] = outs.map((item): ControlValue => {
			const lots = this._getLot(item.amount / defaultItem.lot, precision);

			const findOperation = operationsDirection.find((operation: ActualTradeOperation) => operation.lots === lots) || null;

			return {
				...defaultItem,
				price: item.price,
				stopPrice: item.price,
				lots,
				commission: findOperation ? Math.abs(findOperation.comission.value) : 0,
				quantity: lots * defaultItem.lot,
				total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
				status: ControlValueStatus.EXECUTED,
			};
		});

		const unloadingOrdersDirection = ordersDirection.map((item: TradeOrder) => ({ ...item }));
		const unloadingStopOrdersDirection = stopOrdersDirection.map((item: TradeStopOrder) => ({ ...item }));
		const getLotItem = this._getOutLot(position.idea.targets.length, defaultItem.lot, precision, maxLots);

		const unloadingControlValues: ControlValue[] = position.idea.targets.reduce(
			(acc: ControlValue[], item, index: number) => {
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

				// if (unloadingOrdersDirection.length > 0) {
				//   const findIndexOrder = unloadingOrdersDirection.findIndex((orderItem: TradeOrder) => {
				//     return orderItem.lotsRequested === lots;
				//   });
				//
				//   if (findIndexOrder !== -1) {
				//     unloadingOrdersDirection[findIndexOrder].lotsRequested = -1;
				//     return acc;
				//   }
				// }

				// if (unloadingStopOrdersDirection.length > 0) {
				//   const findIndexOrder = unloadingStopOrdersDirection.findIndex((orderItem: TradeStopOrder) => {
				//     return orderItem.lotsRequested === lots;
				//   });
				//
				//   if (findIndexOrder !== -1) {
				//     unloadingStopOrdersDirection[findIndexOrder].lotsRequested = -1;
				//     return acc;
				//   }
				// }

				acc.push({
					...defaultItem,
					price: item.price,
					stopPrice: item.price,
					commission: 0,
					lots,
					quantity: lots * defaultItem.lot,
					total: getNumberPrecision(item.price * lots * defaultItem.lot, 2),
					orderType: TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
					status: ControlValueStatus.UNLOADING,
				});

				return acc;
			},
			[]
		);

		/**
		 * Все отфильтрованные по направлению лимитные заявки
		 * */
		const orderControlValues: ControlValue[] = ordersDirection.map((item) => ({
			...defaultItem,
			id: item.orderId,
			price: item.initialSecurityPrice.value,
			quantity: item.lotsRequested * defaultItem.lot,
			lots: item.lotsRequested,
			commission: item.initialCommission ? item.initialCommission.value : 0,
			orderType: {
				id: item.orderType,
				type: item.orderTypeText,
			},
			direction: !!item.direction,
			total: getNumberPrecision(item.initialSecurityPrice.value * item.lotsRequested * defaultItem.lot, 2),
			status: ControlValueStatus.AWAITS,
		}));

		/**
		 * Все отфильтрованные по направлению стоп заявки
		 * */
		const stopOrderControlValues: ControlValue[] = stopOrdersDirection
			.filter((item: TradeStopOrder) => item.orderTypeText === TradeStopOrderTypeText.STOP_ORDER_TYPE_TAKE_PROFIT)
			.map((item) => ({
				...defaultItem,
				id: item.stopOrderId,
				price: item.price.value,
				quantity: item.lotsRequested * defaultItem.lot,
				lots: item.lotsRequested,
				commission: 0,
				orderType: {
					id: item.orderType,
					type: item.orderTypeText,
				},
				stopPrice: item.stopPrice.value,
				trailingData: item.trailingData,
				direction: item.direction,
				total: getNumberPrecision(item.price.value * item.lotsRequested * defaultItem.lot, 2),
				status: ControlValueStatus.AWAITS,
			}));

		return {
			actions: executedControlValues,
			ideas: unloadingControlValues,
			orders: [...orderControlValues, ...stopOrderControlValues],
		};
	}

	getStopLossControlValue(
		position: StockPosition,
		maxLots: number,
		temp: ControlValue[],
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operations: ActualTradeOperations
	): (ControlValue & { disabled: boolean }) | null {
		let stopPrice = 0;

		if (position.idea.stop) {
			stopPrice = position.idea.stop.price;
		}

		if (temp[0]) {
			stopPrice = temp[0].price;
		}

		if (stopPrice === 0) {
			return null;
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
			return null;
		}

		if (maxLots === outLots && maxLots !== 0) {
			return null;
		}

		const defaultItem = this.getDefaultControlValue(position, 'reverse');
		const precision = position.idea.instrument.source === 'tinkoff' ? 0 : 8;
		const lots = getNumberPrecision(
			outLots === 0 ? maxLots : position.idea.inPositionQuantity / defaultItem.lot,
			precision
		);

		// if (position.ideas.targets.length) {
		//   if (position.ideas.targets.length === 1) {
		//     stopPrice = position.ideas.targets[0].price;
		//   }
		//   if (position.ideas.targets.length > 1) {
		//     stopPrice = position.ideas.targets[position.ideas.targets.length - 2].price;
		//     console.log(position, position.ideas.targets[position.ideas.targets.length - 2].price);
		//   }
		// }

		const control = {
			...defaultItem,
			disabled: false,
			price: stopPrice,
			lots: lots,
			quantity: getNumberPrecision(lots * defaultItem.lot, precision),
			total: getNumberPrecision(stopPrice * lots * defaultItem.lot, 2),
			commission: 0,
			stopPrice: stopPrice,
			orderType: TRADE_STOP_ORDER_TYPE_STOP_LOSS,
			status: ControlValueStatus.UNLOADING,
		};

		const filterStopOrder =
			stopOrders.find(
				(item: TradeStopOrder) =>
					item.direction === defaultItem.direction &&
					(item.orderTypeText === TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS ||
						item.orderTypeText === TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LIMIT) &&
					item.lotsRequested === control.lots
			) || null;

		if (filterStopOrder !== null) {
			return {
				...control,
				id: filterStopOrder.stopOrderId,
				price: filterStopOrder.price.value,
				stopPrice: filterStopOrder.stopPrice.value,
				orderType: this._getStopOrderByName(filterStopOrder.orderTypeText),
				status: ControlValueStatus.AWAITS,
			};
		}

		const filterOrder =
			orders.find(
				(item: TradeOrder) => !!item.direction === defaultItem.direction && item.lotsRequested === control.lots
			) || null;

		if (filterOrder !== null) {
			return {
				...control,
				id: filterOrder.orderId,
				price: filterOrder.initialSecurityPrice.value,
				stopPrice: filterOrder.initialSecurityPrice.value,
				orderType: { type: filterOrder.orderTypeText, id: filterOrder.orderType },
				status: ControlValueStatus.AWAITS,
			};
		}

		// if (operations.length > 0 && entryLots === outLots) {
		//   if (temp.length === 1) {
		//     const findIndex = operations.findIndex((item: ActualTradeOperation) => item.lots === temp[0].lots);
		//
		//     if (findIndex !== -1) {
		//       return {
		//         ...temp[0],
		//         disabled: true,
		//         status: ControlValueStatus.EXECUTED,
		//       };
		//     }
		//   }
		//
		//   const findIndex = operations.findIndex((item: ActualTradeOperation) => item.lots === lots);
		//
		//   if (findIndex !== -1) {
		//     return {
		//       ...control,
		//       disabled: true,
		//       status: ControlValueStatus.EXECUTED,
		//     };
		//   }
		//
		//   return null;
		// }

		return control;
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

	private _getStopOrderByName(name: string): TradeOrderType | null {
		const list = [TRADE_STOP_ORDER_TYPE_STOP_LOSS, TRADE_STOP_ORDER_TYPE_STOP_LIMIT];

		return list.find((item: TradeOrderType) => item.type === name) || null;
	}
}
