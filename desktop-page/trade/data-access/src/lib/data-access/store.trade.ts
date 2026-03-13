import {ComponentStore} from '@ngrx/component-store';
import {catchError, forkJoin, map, Observable, of, switchMap, tap, timer} from 'rxjs';
import {DataAccess, Response} from 'types/response';
import {
  TradeDirections,
  TradeOperation,
  TradeOperations,
  TradeOrder,
  TradeOrders,
  TradeOrderTypesDescription,
  TradePortfolio,
  TradeStopOrders,
} from './types';
import {Params} from '@angular/router';
import {sortNumber} from 'utils/sort-number';
import {TRADE_ORDERS} from './order.constants';
import {TradeOrderTypeText, TradeStopOrderTypeText} from './order.types';
import {TradeJournal} from 'types/trade';

interface Api {
	getOperations(params: Params): Observable<Response<TradeOperations>>;
	getPortfolio(params: Params): Observable<Response<TradePortfolio>>;
	getOrders(params: Params): Observable<Response<TradeOrders>>;
	getStopOrders(params: Params): Observable<Response<TradeOrders | null>>;
	addOrder(body: Params): Observable<Response<TradeOrders>>;
	addStopOrder(body: Params): Observable<Response<any>>;
	removeOrder(body: Params): Observable<Response<any>>;
	removeStopOrder(body: Params): Observable<Response<any>>;
	getJournal(params: Params): Observable<Response<TradeJournal[]>>;
	setJournalItems(items: TradeJournal[]): Observable<Response<any>>;
	setJournalItem(item: TradeJournal): Observable<Response<any>>;
}

export interface TradeState {
	orderType: TradeOrderTypesDescription | null;
	orders: TradeOrders | null;
	stopOrders: TradeStopOrders | null;
	portfolio: DataAccess<TradePortfolio>;
	operations: TradeOperations | null;
	directionTypes: TradeDirections | null;
	journal: TradeJournal[] | null;
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
	readonly journal$: Observable<TradeJournal[] | null> = this.select((state: TradeState) => state.journal);

	constructor(private _api: Api) {
		super({
			orderType: null,
			orders: null,
			stopOrders: null,
			journal: null,
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
		});

		this.loadOrderTypes();
	}

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
			tap((response) => this.updateJournal(response.data)),
			tap((data) => console.log(data))
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

	setJournalItems = this.effect((stream$: Observable<{ items: TradeJournal[]; params: Params }>) =>
		stream$.pipe(
			switchMap((body: { items: TradeJournal[]; params: Params }) => {
				return this._api.setJournalItems(body.items).pipe(
					tap((response: Response<TradeJournal>) => console.log(response)),
					tap(() => this.loadJournal(body.params))
				);
			})
		)
	);

	setJournalItem = this.effect((stream$: Observable<{ item: TradeJournal; params: Params }>) =>
		stream$.pipe(
			switchMap((body: { item: TradeJournal; params: Params }) => {
				return this._api.setJournalItem(body.item).pipe(
					tap((response: Response<TradeJournal>) => console.log(response)),
					tap(() => this.loadJournal(body.params))
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
