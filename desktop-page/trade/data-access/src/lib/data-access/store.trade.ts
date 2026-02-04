import { ComponentStore } from '@ngrx/component-store';
import { ApiService } from '../../../../src/lib/common/api.service';
import { catchError, forkJoin, map, Observable, of, switchMap, tap, timer } from 'rxjs';
import { Response } from 'types/response';
import {
	TradeAccounts,
	TradeDirections,
	TradeOperation,
	TradeOperations,
	TradeOrder,
	TradeOrders,
	TradeOrderTypesDescription,
	TradePortfolio,
	TradeSources,
	TradeStopOrders,
	TradeToken,
	TradeTokenSource,
} from '@data-access-trade/types';
import { Params } from '@angular/router';
import { sortNumber } from 'utils/sort-number';
import { TRADE_ORDERS } from '../../../../src/lib/common/order.constants';
import { TradeOrderTypeText, TradeStopOrderTypeText } from '../../../../src/lib/common/order.types';

export interface TradeState {
	sources: TradeSources | null;
	token: Response<TradeToken | null> | null;
	accounts: Response<TradeAccounts | null> | null;
	orderType: TradeOrderTypesDescription | null;
	orders: TradeOrders | null;
	stopOrders: TradeStopOrders | null;
	portfolio: Response<TradePortfolio> | null;
	operations: TradeOperations | null;
	directionTypes: TradeDirections | null;
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
	readonly TIMER = 1000 * 30 * 2;

	readonly source$: Observable<TradeSources | null> = this.select((state: TradeState) => state.sources);
	readonly token$: Observable<Response<TradeToken | null> | null> = this.select((state: TradeState) => state.token);
	readonly accounts$: Observable<Response<TradeAccounts | null> | null> = this.select(
		(state: TradeState) => state.accounts
	);
	readonly directionTypes$: Observable<TradeDirections | null> = this.select(
		(state: TradeState) => state.directionTypes
	);
	readonly orderTypes$: Observable<TradeOrderTypesDescription | null> = this.select(
		(state: TradeState) => state.orderType
	);
	readonly orders$: Observable<TradeOrders | null> = this.select((state: TradeState) => state.orders);
	readonly stopOrders$: Observable<TradeStopOrders | null> = this.select((state: TradeState) => state.stopOrders);
	readonly portfolio$: Observable<Response<TradePortfolio> | null> = this.select((state: TradeState) => state.portfolio);
	readonly operations$: Observable<TradeOperations | null> = this.select((state: TradeState) => state.operations);

	constructor(private _api: ApiService) {
		super({
			sources: null,
			token: null,
			accounts: null,
			orderType: null,
			orders: null,
			stopOrders: null,
			portfolio: null,
			operations: null,
			directionTypes: [
				{ id: true, name: 'Купить' },
				{ id: false, name: 'Продать' },
			],
		});
	}

	readonly updateSources = this.updater(
		(state: TradeState, sources: null | TradeSources): TradeState => ({
			...state,
			sources,
		})
	);

	readonly updateToken = this.updater(
		(state: TradeState, token: Response<TradeToken | null> | null): TradeState => ({
			...state,
			token,
		})
	);

	readonly updateAccounts = this.updater(
		(state: TradeState, accounts: Response<TradeAccounts | null> | null): TradeState => ({
			...state,
			accounts,
		})
	);

	readonly updateOrderTypes = this.updater(
		(state: TradeState, orderType: null | TradeOrderTypesDescription): TradeState => ({
			...state,
			orderType,
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

	readonly updatePortfolio = this.updater(
		(state: TradeState, portfolio: null | Response<TradePortfolio>): TradeState => ({
			...state,
			portfolio,
		})
	);

	loadSources = this.effect((stream$: Observable<void>) =>
		stream$.pipe(
			switchMap(() => this._api.getSources()),
			tap((response: Response<TradeSources>) => this.updateSources(response.data))
		)
	);

	loadToken = this.effect((stream$: Observable<number>) =>
		stream$.pipe(
			switchMap((sourceId: number) => this._api.getToken(sourceId)),
			tap((response: Response<TradeToken | null>) => this.updateToken(response))
		)
	);

	changeToken = this.effect((stream$: Observable<TradeTokenSource>) =>
		stream$.pipe(
			switchMap((token: TradeTokenSource) =>
				this._api.changeToken(token).pipe(
					catchError((error: Error | null) => {
						console.error(error);

						return of({
							data: null,
							message: `Error changeToken`,
							success: false,
						});
					})
				)
			),
			tap((response: Response<TradeToken | null>) => this.updateToken(response))
		)
	);

	removeToken = this.effect((stream$: Observable<TradeToken>) =>
		stream$.pipe(
			switchMap((token: TradeToken) => this._api.removeToken(token)),
			tap((response: Response<TradeToken | null>) => response.success && this.updateToken(null))
		)
	);

	loadAccounts = this.effect((stream$: Observable<number>) =>
		stream$.pipe(
			switchMap((sourceId: number) =>
				this._api.getAccounts(sourceId).pipe(
					catchError((error) =>
						of({
							data: null,
							...error.error,
						})
					)
				)
			),
			tap((response: Response<TradeAccounts | null>) => this.updateAccounts(response))
		)
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
			switchMap((params: Params) => this._api.getPortfolio(params)),
			tap((response: Response<TradePortfolio> | null) => response && this.updatePortfolio(response))
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

	addOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) =>
				this._api.addOrder(params).pipe(
					tap((response: Response<any>) => {
						if (response.success) {
							this.loadOrders(params);
							this.loadOperations(params);
						}
					})
				)
			)
		)
	);

	addOrders = this.effect((stream$: Observable<Params[]>) =>
		stream$.pipe(
			switchMap((params: Params[]) => {
				const order = params.filter((item: Params) => this.isOrder(item['orderType']['type']));
				const orderStop = params.filter((item: Params) => this.isStopOrder(item['orderType']['type']));

				return forkJoin([
					...order.map((item: Params) => this._api.addOrder(item)),
					...orderStop.map((item: Params) => this._api.addStopOrder(item)),
				]).pipe(
					switchMap(() =>
						timer(3000).pipe(
							tap(() => {
								this.loadOrders(params[0]);
								this.loadOperations(params[0]);
							})
						)
					)
				);
			})
		)
	);

	removeOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) =>
				this._api.removeOrder(params).pipe(tap((response: Response<any>) => response.success && this.loadOrders(params)))
			)
		)
	);

	changeOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) =>
				this._getRemoveOrder(params).pipe(
					switchMap(() =>
						this._getAddOrder(params).pipe(
							switchMap((response: Response<any>) => timer(3000).pipe(map(() => response))),
							tap((response: Response<any>) => {
								if (response.success) {
									this.loadOperations(params);
									this.loadOrders(params);
								}
							})
						)
					)
				)
			)
		)
	);

	private _getRemoveOrder(params: Params): Observable<Response<any>> {
		if (this.isOrder(params['orderTypePrev'].type)) {
			return this._api.removeOrder({ ...params, orderType: params['orderTypePrev'] });
		}

		return this._api.removeStopOrder({ ...params, orderType: params['orderTypePrev'] });
	}

	private _getAddOrder(params: Params): Observable<Response<any>> {
		if (this.isOrder(params['orderType'].type)) {
			return this._api.addOrder(params);
		}

		return this._api.addStopOrder(params);
	}

	// changeOrder = this.effect((stream$: Observable<Params>) =>
	//   stream$.pipe(
	//     switchMap((params: Params) =>
	//       this._api.removeOrder(params).pipe(
	//         switchMap((removed: Response<any>) =>
	//           this._api.addOrder(params).pipe(
	//             tap((response: Response<any>) => {
	//               if (response.success) {
	//                 this.loadOperations(params);
	//                 this.loadOrders(params);
	//               }
	//             })
	//           )
	//         )
	//       )
	//     )
	//   )
	// );

	addStopOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) =>
				this._api.addStopOrder(params).pipe(
					tap((response: Response<any>) => {
						if (response.success) {
							this.loadOrders(params);
							this.loadOperations(params);
						}
					})
				)
			)
		)
	);

	removeStopOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) =>
				this._api
					.removeStopOrder(params)
					.pipe(tap((response: Response<any>) => response.success && this.loadOrders(params)))
			)
		)
	);

	changeStopOrder = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			switchMap((params: Params) => {
				console.log(params);

				return this._api.removeStopOrder(params).pipe(
					switchMap((removed: Response<any>) => {
						return this._api.addStopOrder(params).pipe(
							tap((response: Response<any>) => {
								if (response.success) {
									this.loadOperations(params);
									this.loadOrders(params);
								}
							})
						);
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

	isOrder(type: string): boolean {
		return this.#orderTypes.includes(type);
	}

	isStopOrder(type: string): boolean {
		return this.#orderStopTypes.includes(type);
	}
}
