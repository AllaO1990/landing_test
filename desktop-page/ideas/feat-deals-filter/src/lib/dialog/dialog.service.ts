import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { FilterDealListComponent, FilterDealValue } from '../filter';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { Params } from '@angular/router';
import { TODAY } from 'tokens/desktop/today';
import { getListOfRange } from 'utils/get-list-of-range';
import { LocalStorage } from 'storage/local.storage';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';

@Injectable()
export class DealFilterDialogService {
	readonly #localStorage: LocalStorage = inject(LOCAL_STORAGE);
	readonly #today: Date = inject(TODAY);
	readonly #rangeList: { text: string; range: TuiDayRange }[] = getListOfRange(this.#today);

	readonly valueDefault = {
		portfolio: FilterDealListComponent.valueDefaultPortfolio,
		dealType: FilterDealListComponent.valueDefaultDealType,
		type: FilterDealListComponent.valueDefaultType,
		strategy: FilterDealListComponent.valueDefaultStrategy,
		broker: FilterDealListComponent.valueDefaultBroker,
		currency: { currency: 'rub', currencyId: 1, currencySymbol: '₽' },
		range: this.#rangeList[5].range,
	};

	protected readonly openFilter: WritableSignal<boolean> = signal(false);

	readonly valueFilter: WritableSignal<FilterDealValue> = signal(this.getValue());
	readonly value: Signal<FilterDealValue> = computed(() => {
		const value = this.valueFilter();

		this.#localStorage.setItem('lightPortfolioFilter', {
			...value,
			range: {
				from: (value.range as TuiDayRange).from.toUtcNativeDate().toISOString(),
				to: new Date((value.range as TuiDayRange).to.toUtcNativeDate().setUTCHours(23, 59, 59)).toISOString(),
			},
		});

		return value;
	});
	readonly isOpenFilter: Signal<boolean> = computed(() => this.openFilter());

	open(): void {
		this.openFilter.set(true);
	}

	close(): void {
		this.openFilter.set(false);
	}

	reset(): void {
		this.valueFilter.set({ ...this.valueDefault, currency: FilterDealListComponent.valueDefaultCurrency });
		this.openFilter.set(false);
	}

	getParams(value: FilterDealValue): Params {
		const { dealType, type, strategy, broker, currency, range, portfolio } = value;
		let rangeValue = null;

		if (range) {
			rangeValue = {
				from: (range as TuiDayRange).from.toUtcNativeDate().toISOString(),
				to: new Date((range as TuiDayRange).to.toUtcNativeDate().setUTCHours(23, 59, 59)).toISOString(),
			};
		}

		return {
			portfolioId: portfolio.portfolioId,
			brokerId: broker.brokerId,
			dealType: dealType.id,
			instrumentType: type.id,
			strategyId: strategy.id,
			currencyId: currency.currencyId,
			...rangeValue,
		};
	}

	getValue(): FilterDealValue {
		const value = this.#localStorage.getItem('lightPortfolioFilter');

		if (value) {
			return {
				...value,
				range: new TuiDayRange(
					TuiDay.fromLocalNativeDate(new Date(value.range.from) || this.#today),
					TuiDay.fromLocalNativeDate(new Date(value.range.to) || this.#today)
				),
			};
		}

		return this.valueDefault;
	}
}
