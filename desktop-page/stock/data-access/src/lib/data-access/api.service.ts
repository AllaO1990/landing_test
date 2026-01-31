import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from 'tokens/desktop/config';
import { Observable, retry, timer } from 'rxjs';
import { StockPrice, WithLastPrice } from 'types/stock';
import { Response } from 'types/response';

@Injectable()
export class ApiStockService {
	readonly #http: HttpClient = inject(HttpClient);
	readonly #config = inject(APP_CONFIG);

	get host() {
		return this.#config.host;
	}

	public getStockPrice(list: (string | number)[]): Observable<Response<StockPrice<WithLastPrice>>> {
		return this.#http
			.post<Response<StockPrice<WithLastPrice>>>(`${this.host}/v1/instruments/last-close-price/by-ids`, {
				ids: [...new Set(list)],
			})
			.pipe(
				retry({
					count: 3,
					delay: (_, retryCount) => timer(Math.pow(2, retryCount - 1) * 1500),
				})
			);
	}
}
