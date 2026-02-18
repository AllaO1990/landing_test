import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { PortfolioParams } from './types';
import { Params } from '@angular/router';

@Injectable()
export class DataAccessPortfolioService {
	readonly params: WritableSignal<PortfolioParams | null> = signal(null);

	readonly paramsUrl: Signal<Params | null> = computed(() => {
		const params = this.params();

		if (!params) {
			return null;
		}

		const { currency, portfolio, ...other } = params;

		return {
			currencyId: currency ? currency.currencyId : null,
			portfolioId: portfolio ? portfolio.portfolioId : null,
			...other,
		};
	});
}
