import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from 'tokens/desktop/config';
import { Observable } from 'rxjs';
import { Response } from 'types/response';
import { TradeLimit } from './types';
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
		return this.#http.delete<Response<TradeLimit>>(`${this.host}/v1/trades/limit`, { body: { currencyId } });
	}
}
