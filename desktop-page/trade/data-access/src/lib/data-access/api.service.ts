import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from 'tokens/desktop/config';
import { catchError, Observable, of } from 'rxjs';
import { Response } from 'types/response';
import {
	TradeAccounts,
	TradeLimit,
	TradeLimitList,
	TradeOperations,
	TradeOrders,
	TradeOrderTypes,
	TradePortfolio,
	TradeSources,
	TradeToken,
	TradeTokenSource,
} from './types';
import { Params } from '@angular/router';

@Injectable()
export class ApiTradeService {
	#http: HttpClient = inject(HttpClient);
	readonly #config = inject(APP_CONFIG);

	get host() {
		return this.#config.host;
	}

	getLimitForCurrency(currencyId: number): Observable<Response<TradeLimit>> {
		return this.#http.get<Response<TradeLimit>>(`${this.host}/v1/trades/limit`, { params: { currencyId } });
	}

	changeLimitForCurrency(params: Params): Observable<Response<TradeLimit>> {
		return this.#http.post<Response<TradeLimit>>(`${this.host}/v1/trades/limit`, {
			currencyId: params['currencyId'],
			limit: params['limit'],
		});
	}

	deleteLimitForCurrency(currencyId: number): Observable<Response<TradeLimit>> {
		return this.#http.delete<Response<TradeLimit>>(`${this.host}/v1/trades/limit`, { params: { currencyId } });
	}

	getSources(): Observable<Response<TradeSources>> {
		return this.#http.get<Response<TradeSources>>(`${this.host}/v1/trades/sources`);
	}

	getAccounts(sourceId: number): Observable<Response<TradeAccounts>> {
		return this.#http.get<Response<TradeAccounts>>(`${this.host}/v1/trades/accounts`, { params: { sourceId } });
	}

	getOrders(params: Params): Observable<Response<TradeOrders>> {
		return this.#http.get<Response<TradeOrders>>(`${this.host}/v1/trades/orders`, {
			params: {
				accountId: params['accountId'],
				instrumentId: params['instrumentId'],
				sourceId: params['sourceId'],
			},
		});
	}

	getStopOrders(params: Params): Observable<Response<TradeOrders>> {
		return this.#http.get<Response<TradeOrders>>(`${this.host}/v1/trades/stop-orders`, {
			params: {
				accountId: params['accountId'],
				instrumentId: params['instrumentId'],
				sourceId: params['sourceId'],
			},
		});
	}

	getToken(sourceId: number): Observable<Response<TradeToken>> {
		return this.#http.get<Response<TradeToken>>(`${this.host}/v1/trades/token`, { params: { sourceId } });
	}

	changeToken(data: TradeTokenSource): Observable<Response<TradeToken>> {
		return this.#http.post<Response<TradeToken>>(`${this.host}/v1/trades/token`, data);
	}

	removeToken(data: TradeToken): Observable<Response<TradeToken>> {
		return this.#http.delete<Response<TradeToken>>(`${this.host}/v1/trades/token`, {
			body: { sourceId: data.sourceId, tokenId: data.tokenId },
		});
	}

	getLimitList(): Observable<Response<TradeLimitList>> {
		return this.#http.get<Response<TradeLimitList>>(`${this.host}/v1/trades/limit/list`);
	}

	getOperations(params: Params): Observable<Response<TradeOperations>> {
		return this.#http.get<Response<TradeOperations>>(`${this.host}/v1/trades/operations`, { params });
	}

	getOrderTypes(): Observable<Response<TradeOrderTypes>> {
		return this.#http.get<Response<TradeOrderTypes>>(`${this.host}/v1/trades/order-types`);
	}

	getPortfolio(params: Params): Observable<Response<TradePortfolio>> {
		return this.#http.get<Response<TradePortfolio>>(`${this.host}/v1/trades/portfolio`, {
			params: {
				accountId: params['accountId'],
				instrumentId: params['instrumentId'],
				sourceId: params['sourceId'],
			},
		});
	}

	addOrder(body: Params): Observable<Response<TradeOrders>> {
		return this.#http.post<Response<TradeOrders>>(`${this.host}/v1/trades/orders`, {
			accountId: body['accountId'],
			direction: body['direction'],
			instrumentId: body['instrumentId'],
			orderType: body['orderType']['id'],
			price: body['price'],
			quantity: body['quantity'],
			sourceId: body['sourceId'],
		});
	}

	addStopOrder(body: Params): Observable<Response<any>> {
		return this.#http
			.post<Response<TradeOrders>>(`${this.host}/v1/trades/stop-orders`, {
				accountId: body['accountId'],
				direction: body['direction'],
				exchangeOrderType: 0,
				expirationType: body['expirationType']['id'],
				expireDate: body['expireDate'],
				instrumentId: body['instrumentId'],
				price: body['price'],
				quantity: body['quantity'],
				sourceId: body['sourceId'],
				priceType: 0,
				stopOrderType: body['orderType']['id'],
				stopPrice: body['stopPrice'],
				takeProfitType: 0,
				trailingData: body['trailingData'],
			})
			.pipe(
				catchError((error: Error) => {
					console.warn(error);

					return of({
						data: null,
						message: error.message,
						success: false,
					});
				})
			);
	}

	removeOrder(body: Params): Observable<Response<any>> {
		return this.#http
			.delete<Response<any>>(`${this.host}/v1/trades/orders`, {
				body: {
					accountId: body['accountId'],
					orderId: body['id'],
					sourceId: body['sourceId'],
				},
			})
			.pipe(
				catchError((error: Error) => {
					console.warn(error);

					return of({
						data: null,
						message: error.message,
						success: false,
					});
				})
			);
	}

	removeStopOrder(body: Params): Observable<Response<any>> {
		return this.#http
			.delete<Response<any>>(`${this.host}/v1/trades/stop-orders`, {
				body: {
					accountId: body['accountId'],
					orderId: body['id'],
					sourceId: body['sourceId'],
				},
			})
			.pipe(
				catchError((error: Error) => {
					console.warn(error);

					return of({
						data: body,
						message: error.message,
						success: false,
					});
				})
			);
	}
}
