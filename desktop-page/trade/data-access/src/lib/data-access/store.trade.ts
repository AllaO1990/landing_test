import { ComponentStore } from '@ngrx/component-store';
import { catchError, filter, forkJoin, map, Observable, of, switchMap, tap, timer } from 'rxjs';
import { DataAccess, Response } from 'types/response';
import {
	ResponseTradeStopOrder,
	TradeDirections,
	TradeOperation,
	TradeOperations,
	TradeOrder,
	TradeOrderParams,
	TradeOrders,
	TradeOrderType,
	TradeOrderTypesDescription,
	TradePortfolio,
	TradeStopOrders,
} from './types';
import { Params } from '@angular/router';
import { sortNumber } from 'utils/sort-number';
import { TRADE_ORDERS } from './order.constants';
import { TradeOrderTypeText, TradeStopOrderTypeText } from './order.types';
import { TradeJournal, TradeJournalStatus } from 'types/trade';
import { HttpErrorResponse } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';

interface Api {
	getOperations(params: Params): Observable<Response<TradeOperations>>;
	getPortfolio(params: Params): Observable<Response<TradePortfolio>>;
	getOrders(params: Params): Observable<Response<TradeOrders>>;
	getStopOrders(params: Params): Observable<Response<TradeOrders | null>>;
	addOrder(body: TradeOrderParams): Observable<Response<TradeOrder>>;
	addStopOrder(body: TradeJournal): Observable<Response<ResponseTradeStopOrder | null>>;
	removeOrder(body: Params): Observable<Response<any>>;
	removeStopOrder(body: Params): Observable<Response<any>>;
	getJournal(params: Params): Observable<Response<TradeJournal[] | null>>;
	setJournalItems(items: TradeJournal[]): Observable<Response<any>>;
	removeJournalItem(id: number): Observable<Response<any>>;
	setJournalItem(item: TradeJournal): Observable<Response<any>>;
}

export interface TradeState {
	orderType: TradeOrderTypesDescription | null;
	orders: TradeOrders | null;
	stopOrders: TradeStopOrders | null;
	portfolio: DataAccess<TradePortfolio>;
	operations: TradeOperations | null;
	directionTypes: TradeDirections | null;
	journal: TradeJournal[] | null | undefined;
	isLoading: boolean;
}

export class TradeStore extends ComponentStore<TradeState> {
	readonly #orderTypes: string[] = [
		TradeOrderTypeText.ORDER_TYPE_LIMIT,
		TradeOrderTypeText.ORDER_TYPE_MARKET,
		TradeOrderTypeText.ORDER_TYPE_BESTPRICE,
	];
	readonly #orderStopTypes: string[] = [
		TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LIMIT,
		TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS,
		TradeStopOrderTypeText.STOP_ORDER_TYPE_TAKE_PROFIT,
	];

	readonly reload: WritableSignal<void> = signal(undefined, {
		equal: () => false,
	});

	readonly directionTypes$: Observable<TradeDirections | null> = this.select(
		(state: TradeState) => state.directionTypes
	);
	readonly orderTypes$: Observable<TradeOrderTypesDescription | null> = this.select(
		(state: TradeState) => state.orderType
	);
	readonly orders$: Observable<TradeOrders | null> = this.select((state: TradeState) => state.orders);
	readonly stopOrders$: Observable<TradeStopOrders | null> = this.select((state: TradeState) => state.stopOrders);
	readonly portfolio$: Observable<DataAccess<TradePortfolio>> = this.select((state: TradeState) => state.portfolio);
	readonly operations$: Observable<TradeOperations | null> = this.select((state: TradeState) => state.operations);
	readonly journal$: Observable<TradeJournal[] | null | undefined> = this.select((state: TradeState) => state.journal);
	readonly isLoading$: Observable<boolean> = this.select((state: TradeState) => state.isLoading);

	constructor(private _api: Api) {
		super({
			orderType: null,
			orders: null,
			stopOrders: null,
			journal: undefined,
			portfolio: {
				data: null,
				isLoading: false,
				isLoaded: false,
			},
			operations: null,
			directionTypes: [
				{ id: true, name: 'Купить' },
				{ id: false, name: 'Продать' },
			],
			isLoading: false,
		});

		this.loadOrderTypes();
	}

	readonly updateOrderTypes = this.updater(
		(state: TradeState, orderType: null | TradeOrderTypesDescription): TradeState => ({
			...state,
			orderType,
		})
	);

	readonly updateIsLoading = this.updater(
		(state: TradeState, isLoading: boolean): TradeState => ({
			...state,
			isLoading,
		})
	);

	readonly updateOrders = this.updater(
		(state: TradeState, orders: null | TradeOrders): TradeState => ({
			...state,
			orders: this._sortOrders(orders),
		})
	);

	readonly updateStopOrders = this.updater(
		(state: TradeState, stopOrders: null | any): TradeState => ({
			...state,
			stopOrders,
		})
	);

	readonly updateOperations = this.updater(
		(state: TradeState, operations: null | TradeOperations): TradeState => ({
			...state,
			operations: this._sortOperations(operations),
		})
	);

	readonly updateJournal = this.updater(
		(state: TradeState, journal: null | TradeJournal[]): TradeState => ({
			...state,
			journal,
		})
	);

	readonly updatePortfolio = this.updater(
		(state: TradeState, portfolio: null | TradePortfolio): TradeState => ({
			...state,
			portfolio: {
				data: portfolio,
				isLoaded: true,
				isLoading: false,
			},
		})
	);

	readonly updatePortfolioLoading = this.updater(
		(state: TradeState, isLoading: boolean): TradeState => ({
			...state,
			portfolio: {
				...state.portfolio,
				isLoading,
			},
		})
	);

	loadOrderTypes = this.effect((stream$: Observable<void>) =>
		stream$.pipe(
			switchMap(() => {
				return of({
					message: 'mocks',
					success: true,
					data: TRADE_ORDERS,
				});

				// return this._api.getOrderTypes();
			}),
			tap((response: Response<TradeOrderTypesDescription>) => this.updateOrderTypes(response.data))
		)
	);

	loadOperations = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) => this._api.getOperations(params)),
			catchError((error) => {
				let response: Response<null | TradeOperations> = {
					data: null,
					message: error.message,
					success: false,
				};

				if (error.status === 500) {
					response = {
						...response,
						data: [],
						success: true,
					};
				}

				return of(response);
			}),
			tap((response: Response<TradeOperations | null>) => response.success && this.updateOperations(response.data))
		)
	);

	loadPortfolio = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			tap(() => this.updatePortfolioLoading(true)),
			switchMap((params: Params) => this._api.getPortfolio(params)),
			tap((response: Response<TradePortfolio> | null) => response && this.updatePortfolio(response.data))
		)
	);

	loadJournal = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) => this._api.getJournal(params)),
			tap((response) => {
				this.updateJournal(response.data);
			})
		)
	);

	loadOrders = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) =>
				forkJoin([
					this._api.getOrders(params),
					this._api.getStopOrders(params).pipe(
						catchError((error: Error) => {
							console.log(error);

							return of({
								data: null,
								message: error.message,
								success: false,
							});
						})
					),
				])
			),
			tap(([orders, stopOrders]: [Response<TradeOrders | null>, Response<TradeOrders | null>]) => {
				orders.success && this.updateOrders(orders.data);
				stopOrders.success && this.updateStopOrders(stopOrders.data);
			})
		)
	);

	addOrder = this.effect((stream$: Observable<TradeOrderParams>) =>
		stream$.pipe(
			switchMap((journal: TradeOrderParams) =>
				this._api.addOrder(journal).pipe(
					tap((response: Response<TradeOrder>) => {
						if (response.success) {
							this.setJournalItem({ ...journal, externalId: response.data.orderId as string } as TradeJournal);

							this.reload.set();

							// this.loadOrders(journal);
							// this.loadOperations(journal);
						}
					}),
					catchError((err: HttpErrorResponse) => {
						console.log(err, err.error.message.indexOf('30057'));
						return of({
							data: null,
							message: err.error.message,
							success: false,
						});
					})
				)
			)
		)
	);

	addOrders = this.effect((stream$: Observable<TradeJournal[]>) =>
		stream$.pipe(
			switchMap((journal: TradeJournal[]) => {
				const order = journal.filter((item: TradeJournal) => this.isOrder(item.orderTypeText));
				const orderStop = journal.filter((item: TradeJournal) => this.isStopOrder(item.orderTypeText));

				return forkJoin([
					...order.map((item: TradeJournal) =>
						this._api.addOrder(item).pipe(
							map((response: Response<any>) => {
								if (response.success) {
									return {
										...item,
										orderId: response.data.orderId,
										ideaDate: this._getDateForJournal(item),
										status: TradeJournalStatus.AWAITS,
									};
								}
								return {
									...item,
									status: TradeJournalStatus.BROKEN,
								};
							}),
							catchError((err: HttpErrorResponse) => {
								console.log(err, err.error.message.indexOf('30057'));
								// if (err.error.message.indexOf('30057')) {
								// 	return this._api.removeJournalItem(item.id).pipe(
								// 		switchMap((responseRemove: Response<any>) => {
								// 			if (responseRemove.success) {
								// 				return this._api.setJournalItem({ ...item, id: 0, externalId: null }).pipe(
								// 					switchMap((responseSet: Response<any>) =>
								// 						this._api.addOrder(responseSet.data).pipe(
								// 							map((response: Response<any>) => {
								// 								if (response.success) {
								// 									return {
								// 										...item,
								// 										orderId: response.data.orderId,
								// 										ideaDate: this._getDateForJournal(item),
								// 										status: TradeJournalStatus.AWAITS,
								// 									};
								// 								}
								// 								return {
								// 									...item,
								// 									status: TradeJournalStatus.BROKEN,
								// 								};
								// 							})
								// 						)
								// 					)
								// 				);
								// 			}
								//
								// 			return of(null);
								// 		})
								// 	);
								// }

								return of(null);
							}),
							filter((item: TradeJournal | null) => item !== null)
						)
					),
					...orderStop.map((item: TradeJournal) =>
						this._api.addStopOrder(item).pipe(
							map((response: Response<ResponseTradeStopOrder | null>) => {
								if (!response.success || !response.data) {
									console.warn(`StopOrder не выставлен. Количество: ${item.quantity}, цена: ${item.price}`);
								}

								return {
									...item,
									orderId: response.data && response.data.stopOrderId,
									ideaDate: this._getDateForJournal(item),
									status: TradeJournalStatus.AWAITS,
								};
							})
						)
					),
				]).pipe(
					switchMap((list: TradeJournal[]) => {
						if (list.length > 0) {
							return timer(1000).pipe(
								switchMap(() => this._api.setJournalItems(list)),
								tap((response: Response<TradeOrder>) => {
									if (response.success) {
										this.reload.set();
									}
								})
							);
						}

						return of(list);
					})
				);
			})
		)
	);

	removeOrders = this.effect((stream$: Observable<TradeJournal[]>) =>
		stream$.pipe(switchMap((journal: TradeJournal[]) => this._removeAllOrders(journal)))
	);

	removeOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((journal: Params) => {
				return this._removeOrder(journal).pipe(
					tap((response: Response<any>) => {
						if (response.success) {
							this.reload.set();

							// this.loadOrders(journal);
							// this.loadOperations(journal);
							// this.loadJournal(journal);
						}
					})
				);
			})
		)
	);

	removeBrokerOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) =>
				this._api.removeOrder(params).pipe(
					tap((response: Response<TradeOrder>) => {
						if (response.success) {
							this.reload.set();

							// this.loadOrders(params);
							// this.loadOperations(params);
						}
					})
				)
			)
		)
	);

	changeOrder = this.effect((stream$: Observable<TradeJournal & { orderTypePrev: TradeOrderType | null }>) =>
		stream$.pipe(
			switchMap((params: TradeJournal & { orderTypePrev: TradeOrderType | null }) =>
				this._getRemoveOrder(params).pipe(
					switchMap(() =>
						this._getAddOrder(params).pipe(
							switchMap((response: Response<any>) => timer(3000).pipe(map(() => response))),
							tap((response: Response<any>) => {
								if (response.success) {
									this.reload.set();

									// this.loadOrders(params);
									// this.loadOperations(params);
								}
							})
						)
					)
				)
			)
		)
	);

	private _getRemoveOrder(journal: TradeJournal & { orderTypePrev: TradeOrderType | null }): Observable<Response<any>> {
		const { orderTypePrev, ...other } = journal;
		const typePrev: TradeOrderType = orderTypePrev ? orderTypePrev : { id: other.orderType, type: other.orderTypeText };

		if (this.isOrder(typePrev.type)) {
			return this._api.removeOrder({ ...other, orderType: typePrev.id, orderTypeText: typePrev.type });
		}

		return this._api.removeStopOrder({ ...other, orderType: typePrev.type, orderTypeText: typePrev.id });
	}

	private _getAddOrder(params: TradeJournal): Observable<Response<any>> {
		if (this.isOrder(params['orderTypeText'])) {
			return this._api.addOrder(params);
		}

		return this._api.addStopOrder(params);
	}

	addStopOrder = this.effect((stream$: Observable<TradeJournal>) =>
		stream$.pipe(
			switchMap((params: TradeJournal) =>
				this._api.addStopOrder(params).pipe(
					tap((response: Response<any>) => {
						if (response.success) {
							this.reload.set();

							// this.loadOrders(params);
							// this.loadOperations(params);
						}
					})
				)
			)
		)
	);

	removeStopOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((journal: Params) => {
				return this._removeStopOrder(journal).pipe(
					switchMap((response: Response<any>) =>
						timer(500).pipe(
							tap(() => {
								if (response.success) {
									this.reload.set();

									// this.loadOrders(journal);
									// this.loadOperations(journal);
									// this.loadJournal(journal);
								}
							})
						)
					)
				);
			})
		)
	);

	removeBrokerStopOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) =>
				this._api.removeStopOrder(params).pipe(
					tap((response: Response<TradeStopOrders>) => {
						if (response.success) {
							this.reload.set();

							// this.loadOrders(params);
							// this.loadOperations(params);
						}
					})
				)
			)
		)
	);

	justRemoveBrokerStopOrder = this.effect((stream$: Observable<Params[]>) =>
		stream$.pipe(switchMap((params: Params[]) => forkJoin([...params.map((item) => this._api.removeStopOrder(item))])))
	);

	changeStopOrder = this.effect((stream$: Observable<TradeJournal>) =>
		stream$.pipe(
			switchMap((params: TradeJournal) => {
				return this._api.removeStopOrder(params).pipe(
					switchMap(() => {
						return this._api.addStopOrder(params).pipe(
							tap((response: Response<any>) => {
								if (response.success) {
									this.reload.set();

									// this.loadOperations(params);
									// this.loadOrders(params);
								}
							})
						);
					})
				);
			})
		)
	);

	setJournalItems = this.effect((stream$: Observable<TradeJournal[]>) =>
		stream$.pipe(
			switchMap((journal: TradeJournal[]) => {
				return this._api.setJournalItems(this._updateJournal(journal)).pipe(
					tap(() =>
						// this.loadJournal(journal[0])
						this.reload.set()
					)
				);
			})
		)
	);

	setJournalList = this.effect((stream$: Observable<TradeJournal[]>) =>
		stream$.pipe(
			switchMap((journal: TradeJournal[]) => {
				return forkJoin(this._updateJournal(journal).map((item: TradeJournal) => this._api.setJournalItem(item))).pipe(
					tap((response: Response<any>[]) => {
						if (response.every((item) => item.success)) {
							this.loadJournal(journal[0]);
						}
					})
				);
			})
		)
	);

	setJournalItem = this.effect((stream$: Observable<TradeJournal>) =>
		stream$.pipe(
			switchMap((journal: TradeJournal) => {
				return this._api
					.setJournalItem({
						...journal,
						ideaDate: this._getDateForJournal(journal),
					})
					.pipe(tap(() => this.loadJournal(journal)));
			})
		)
	);

	removeJournalItem = this.effect((stream$: Observable<TradeJournal>) =>
		stream$.pipe(
			filter((item: TradeJournal) => item.id !== null),
			switchMap((item: TradeJournal) => {
				return this._api.removeJournalItem(item.id as number).pipe(
					switchMap((response: Response<any>) =>
						timer(500).pipe(
							tap(() => {
								if (response.success) {
									this.reload.set();

									// this.loadJournal(item);
									// this.loadOrders(item);
								}
							})
						)
					)
				);
			})
		)
	);

	justRemoveJournal = this.effect((stream$: Observable<TradeJournal[]>) =>
		stream$.pipe(
			switchMap((item: TradeJournal[]) => {
				return forkJoin([
					...item
						.filter((item: TradeJournal) => item.id !== null || item.id !== 0)
						.map((item: TradeJournal) => this._api.removeJournalItem(item.id as number)),
				]);
			})
		)
	);

	/**
	 * ✓
	 * */
	onSubmitJournal = this.effect((stream$: Observable<{ removed: TradeJournal[]; update: TradeJournal[] }>) =>
		stream$.pipe(
			switchMap(({ removed, update }: { removed: TradeJournal[]; update: TradeJournal[] }) => {
				if (removed.length !== 0) {
					return this._removeAllOrders(removed).pipe(switchMap(() => of(update)));
				}

				return of(update);
			}),
			switchMap((journal: TradeJournal[]) => {
				return this._api.setJournalItems(this._updateJournal(journal)).pipe(
					tap(() => {
						this.reload.set();

						// this.loadOrders(journal[0]);
						// this.loadOperations(journal[0]);
						// this.loadJournal(journal[0]);
					})
				);
			})
		)
	);

	private _sortOrders(orders: null | TradeOrders): null | TradeOrders {
		if (orders === null) {
			return null;
		}

		return orders.sort((a: TradeOrder, b: TradeOrder) =>
			sortNumber(new Date(a.orderDate).valueOf(), new Date(b.orderDate).valueOf())
		);
	}

	private _sortOperations(operations: TradeOperations | null): null | TradeOperations {
		if (operations === null) {
			return null;
		}

		return operations.sort((a: TradeOperation, b: TradeOperation) =>
			sortNumber(new Date(a.date).valueOf(), new Date(b.date).valueOf())
		);
	}

	private _removeOrder(journal: Params): Observable<any> {
		return this._api.removeOrder(journal).pipe(
			switchMap((response: Response<any>) => {
				if (response.success || response.message.indexOf('30027')) {
					return this._api.removeJournalItem(journal['id'] as number);
				}

				return of(response);
			})
		);
	}

	private _removeStopOrder(journal: Params): Observable<any> {
		return this._api.removeStopOrder(journal).pipe(
			switchMap((response: Response<any>) => {
				if (response.success || response.message.indexOf('30027')) {
					return this._api.removeJournalItem(journal['id'] as number);
				}

				return of(response);
			})
		);
	}

	private _removeAllOrders(journal: TradeJournal[]): Observable<Response<any>[]> {
		const order = journal.filter((item: TradeJournal) => this.isOrder(item.orderTypeText));
		const orderStop = journal.filter((item: TradeJournal) => this.isStopOrder(item.orderTypeText));

		return forkJoin([
			...order.map((item: TradeJournal) => this._removeOrder(item)),
			...orderStop.map((item: TradeJournal) => this._removeStopOrder(item)),
		]);
	}

	private _updateJournal(journal: TradeJournal[]): TradeJournal[] {
		return journal.map((item) => ({ ...item, ideaDate: this._getDateForJournal(item) }));
	}

	private _getDateForJournal(journal: TradeJournal): string | null {
		if (journal.ideaDate) {
			return journal.ideaDate;
		}

		const date = new Date();

		date.setUTCHours(date.getHours() - 3);
		date.setMinutes(date.getMinutes() - 1);

		return date.toISOString();
	}

	isOrder(type: string): boolean {
		return this.#orderTypes.includes(type);
	}

	isStopOrder(type: string): boolean {
		return this.#orderStopTypes.includes(type);
	}
}
