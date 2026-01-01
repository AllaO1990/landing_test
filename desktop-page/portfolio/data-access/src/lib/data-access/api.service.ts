import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from 'tokens/desktop/config';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import { Response } from 'types/response';
import { AccountBalance, AccountBalanceHistory, AccountTransactions } from 'types/account';

@Injectable()
export class ApiPortfolioService {
	#http: HttpClient = inject(HttpClient);
	readonly #config = inject(APP_CONFIG);

	get host() {
		return this.#config.host;
	}

	getAccountBalance(params: Params): Observable<Response<AccountBalance>> {
		return this.#http.post<Response<AccountBalance>>(`${this.host}/v1/account/balance`, {
			brokerId: params['brokerId'] || null,
			currencyId: params['currencyId'] || null,
			from: params['from'] || null,
			instrumentType: params['instrumentType'] || null,
			leadToCurrency: params['leadToCurrency'] || null,
			portfolioId: params['portfolioId'] || null,
			strategyId: params['strategyId'] || null,
			to: params['to'] || null,
		});
	}

	getAccountBalanceHistory(params: Params): Observable<Response<AccountBalanceHistory>> {
		return this.#http.post<Response<AccountBalanceHistory>>(`${this.host}/v1/account/balance/history`, {
			brokerId: params['brokerId'] || null,
			currencyId: params['currencyId'] || null,
			from: params['from'] || null,
			instrumentType: params['instrumentType'] || null,
			leadToCurrency: params['leadToCurrency'] || null,
			portfolioId: params['portfolioId'] || null,
			strategyId: params['strategyId'] || null,
			to: params['to'] || null,
		});
	}

	getAccountTransactions(params: Params): Observable<Response<AccountTransactions>> {
		return this.#http.post<Response<AccountTransactions>>(`${this.host}/v1/account/transactions`, params);
	}

	editAccountTransactions(id: number | string, params: Params): Observable<Response<any>> {
		return this.#http.patch<Response<any>>(`${this.host}/v1/account/transactions/${id}`, params);
	}

	deleteAccountTransactions(id: number | string): Observable<Response<number>> {
		return this.#http.delete<Response<number>>(`${this.host}/v1/account/transactions/${id}`);
	}
}
