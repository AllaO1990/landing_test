import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {APP_CONFIG} from 'tokens/desktop/config';
import {catchError, Observable, of} from 'rxjs';
import {Response} from 'types/response';
import {
  TradeAccounts,
  TradeLimit,
  TradeLimitList,
  TradeOperations,
  TradeOrder,
  TradeOrderParams,
  TradeOrders,
  TradeOrderTypes,
  TradePortfolio,
  TradeSources,
  TradeToken,
  TradeTokenSource,
} from './types';
import {Params} from '@angular/router';
import {TradeJournal} from 'types/trade';

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

	addOrder(body: TradeOrderParams): Observable<Response<TradeOrder>> {
		return this.#http.post<Response<TradeOrder>>(`${this.host}/v1/trades/orders`, {
			orderId: body['externalId'],
			accountId: body['accountId'],
			direction: body['direction'],
			instrumentId: body['instrumentId'],
			orderType: body['orderType'],
			price: body['price'],
			quantity: body['lots'],
			sourceId: body['sourceId'],
		});
	}

	addStopOrder(body: TradeJournal): Observable<Response<any>> {
		return this.#http
			.post<Response<TradeOrders>>(`${this.host}/v1/trades/stop-orders`, {
				accountId: body['accountId'],
				direction: body['direction'],
				exchangeOrderType: 0,
				expirationType: body['expirationType'],
				expireDate: body['expireDate'],
				instrumentId: body['instrumentId'],
				price: body['price'],
				quantity: body['lots'],
				sourceId: body['sourceId'],
				priceType: 0,
				stopOrderType: body['orderType'],
				stopPrice: body['stopPrice'],
				takeProfitType: 0,
				trailingData: {
					indent: body['trailingIndent'],
					indentType: body['trailingIndentType'],
					spread: body['trailingSpread'],
					spreadType: body['trailingSpreadType'],
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

	removeOrder(body: Params): Observable<Response<any>> {
		return this.#http
			.delete<Response<any>>(`${this.host}/v1/trades/orders`, {
				body: {
					accountId: body['accountId'],
					orderId: body['orderId'],
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
					orderId: body['orderId'],
					sourceId: body['sourceId'],
				},
			})
			.pipe(
				catchError((error: HttpErrorResponse) => {
					return of({
						data: body,
						message: error.error.message,
						success: false,
					});
				})
			);
	}

	getJournal(params: Params): Observable<Response<any>> {
		return this.#http.get<Response<any>>(`${this.host}/v1/trades/journal`, {
			params: getCleanParams(params, ['accountId', 'instrumentId', 'ideaId']),
		});
	}

	setJournalItem(item: any): Observable<Response<any>> {
		return this.#http.post<Response<any>>(`${this.host}/v1/trades/journal`, item);
	}

	removeJournalItem(id: number): Observable<Response<any>> {
		return this.#http.delete<Response<any>>(`${this.host}/v1/trades/journal`, { body: { id } });
	}

	setJournalItems(items: TradeJournal[]): Observable<Response<any>> {
		return this.#http.post<Response<any>>(
			`${this.host}/v1/trades/journal-items`,
			items.map((item: TradeJournal) => {
				const { orderId, ...other } = item;

				return other;
			})
		);
	}
}

const getCleanParams = (params: Params, list: string[] = []): Params => {
	return list.reduce((acc: Params, item: string) => {
		if (params[item]) {
			acc[item] = params[item];
		}

		return acc;
	}, {});
};
