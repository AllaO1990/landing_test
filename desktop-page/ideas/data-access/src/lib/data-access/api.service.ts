import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponsePositions } from 'types/position';
import { DataList, Response } from 'types/response';
import { APP_CONFIG } from 'tokens/desktop/config';
import { PortfolioPosition } from 'types/portfolio';

@Injectable()
export class ApiIdeasService {
	#http: HttpClient = inject(HttpClient);
	readonly #config = inject(APP_CONFIG);

	get host() {
		return this.#config.host;
	}

	public getIdeaList(params: Params): Observable<Response<ResponsePositions>> {
		return this.#http.post<Response<ResponsePositions>>(`${this.host}/v1/ideas`, {
			currencyId: params['currencyId'] ?? null,
			instrumentType: params['instrumentType'] ?? null,
			limit: params['limit'] ?? null,
			page: params['page'] ?? null,
			query: params['query'] ?? null,
			strategyId: params['strategyId'] ?? null,
		});
	}

	public getPortfolio(params: Params): Observable<Response<DataList<PortfolioPosition>>> {
		return this.#http.post<Response<DataList<PortfolioPosition>>>(`${this.host}/v1/ideas/portfolio`, {
			author: params['author'] || null,
			brokerId: params['brokerId'] || null,
			currencyId: params['currencyId'] || null,
			dealType: params['dealType'] || null,
			instrumentType: params['instrumentType'] || null,
			limit: params['limit'] || null,
			page: params['page'] || null,
			query: params['query'] || null,
			strategyId: params['strategyId'] || null,
			portfolioId: params['portfolioId'] || null,
			from: params['from'] || null,
			to: params['to'] || null,
		});
	}

	deleteIdea(id: string | number): Observable<Response<number>> {
		return this.#http.delete<Response<number>>(`${this.host}/v1/ideas/${id}`);
	}
}
