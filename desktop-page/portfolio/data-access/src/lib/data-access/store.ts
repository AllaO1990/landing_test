import { ComponentStore } from '@ngrx/component-store';
import { forkJoin, map, Observable, switchMap, tap, timer } from 'rxjs';
import { Params } from '@angular/router';
import { Response } from 'types/response';
import { AccountBalance, AccountBalanceHistory, AccountBalanceHistoryItem } from 'types/account';
import { PortfolioData } from './types';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { addMinutes } from 'date-fns/addMinutes';
import { isSameDay } from 'date-fns/isSameDay';
import { eachMonthOfInterval } from 'date-fns/eachMonthOfInterval';
import { isSameMonth } from 'date-fns/isSameMonth';
import { getNumberPrecision } from 'utils/get-number-precision';

interface PortfolioApi {
	getAccountBalance(params: Params): Observable<Response<AccountBalance>>;
	getAccountBalanceHistory(params: Params): Observable<Response<AccountBalanceHistory>>;
}

export interface DataAccessPortfolioState {
	balance: PortfolioData<AccountBalance>;
	history: PortfolioData<AccountBalanceHistory>;
	balanceHistory: PortfolioData<AccountBalanceHistory>;
}

export class DataAccessPortfolioStore extends ComponentStore<DataAccessPortfolioState> {
	readonly balance$: Observable<PortfolioData<AccountBalance>> = this.select((state) => state.balance);
	readonly history$: Observable<PortfolioData<AccountBalanceHistory>> = this.select((state) => state.history);
	readonly balanceHistory$: Observable<PortfolioData<AccountBalanceHistory>> = this.select(
		(state) => state.balanceHistory
	);

	static defaultState: DataAccessPortfolioState = {
		balance: {
			isLoaded: false,
			isLoading: false,
			data: null,
		},
		history: {
			isLoaded: false,
			isLoading: false,
			data: null,
		},
		balanceHistory: {
			isLoaded: false,
			isLoading: false,
			data: null,
		},
	};

	constructor(private api: PortfolioApi) {
		super(DataAccessPortfolioStore.defaultState);
	}

	readonly updateBalanceLoading = this.updater(
		(state: DataAccessPortfolioState, isLoading: boolean): DataAccessPortfolioState => ({
			...state,
			balance: {
				...state.balance,
				isLoading,
			},
		})
	);

	readonly updateBalanceData = this.updater(
		(state: DataAccessPortfolioState, data: null | AccountBalance): DataAccessPortfolioState => ({
			...state,
			balance: {
				data,
				isLoaded: true,
				isLoading: true,
			},
		})
	);

	readonly updateHistoryLoading = this.updater(
		(state: DataAccessPortfolioState, isLoading: boolean): DataAccessPortfolioState => ({
			...state,
			history: {
				...state.history,
				isLoading,
			},
		})
	);

	readonly updateHistoryData = this.updater(
		(state: DataAccessPortfolioState, data: null | AccountBalanceHistory): DataAccessPortfolioState => ({
			...state,
			history: {
				data,
				isLoaded: true,
				isLoading: true,
			},
		})
	);

	readonly updateBalanceHistoryData = () =>
		this.patchState((state: DataAccessPortfolioState): DataAccessPortfolioState => {
			if (state.history.data !== null && state.balance.data !== null) {
				const items = state.history.data.items.slice();
				items[items.length - 1] = {
					date: items[items.length - 1].date,
					balance: getNumberPrecision(items[items.length - 1].balance + state.balance.data.inPositionProfit, 2),
				};

				return {
					...state,
					balanceHistory: {
						isLoaded: true,
						isLoading: true,
						data: {
							currencySymbol: state.history.data.currencySymbol,
							items,
						},
					},
				};
			}

			return {
				...state,
				balanceHistory: {
					isLoaded: false,
					isLoading: false,
					data: null,
				},
			};
		});

	readonly loadBalance = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			tap(() => this.updateBalanceLoading(false)),
			switchMap((params: Params) =>
				forkJoin([this.api.getAccountBalance(params), timer(1000)]).pipe(
					map(([response]: [Response<AccountBalance>, number]) => response && this.updateBalanceData(response.data))
				)
			),
			tap(() => this.updateBalanceHistoryData())
		)
	);

	readonly loadHistory = this.effect((stream$: Observable<Params>) =>
		stream$.pipe(
			tap(() => this.updateHistoryLoading(false)),
			switchMap((params: Params) =>
				forkJoin([this.api.getAccountBalanceHistory(params), timer(1000)]).pipe(
					map(
						([response]: [Response<AccountBalanceHistory>, number]) =>
							response.data && this._getAccountBalanceHistory(response.data, params['from'], params['to'])
					),
					tap((data: AccountBalanceHistory) => {
						this.updateHistoryData(data);
					})
				)
			),
			tap(() => this.updateBalanceHistoryData())
		)
	);

	_getAccountBalanceHistory(data: AccountBalanceHistory, from: string, to: string): AccountBalanceHistory {
		const dateFrom = new Date(from).setUTCHours(12);
		const dateTo = new Date(to).setUTCHours(12);
		const timezoneOffset = new Date().getTimezoneOffset() * -1;

		const rangeDayArray = eachDayOfInterval({
			start: dateFrom,
			end: dateTo,
		}).map((item: Date) => addMinutes(item, timezoneOffset));

		if (rangeDayArray.length === data.items.length) {
			return data;
		}

		if (rangeDayArray.length <= 31) {
			const list: AccountBalanceHistoryItem[] = [];

			for (let i = 0; i < rangeDayArray.length; i++) {
				const findIndex = data.items.findIndex((item) => isSameDay(rangeDayArray[i], new Date(item.date)));

				if (findIndex !== -1) {
					list.push(data.items[findIndex]);
				} else if (i === 0) {
					list.push({ date: rangeDayArray[i].toISOString(), balance: 0 });
				} else {
					list.push({ date: rangeDayArray[i].toISOString(), balance: list[i - 1].balance });
				}
			}

			return { ...data, items: list };
		}

		const rangeMonthArray = eachMonthOfInterval({ start: dateFrom, end: dateTo });
		const list: AccountBalanceHistoryItem[] = [];

		for (let i = 0; i < rangeMonthArray.length; i++) {
			const findIndex = data.items.findIndex((item) => isSameMonth(rangeMonthArray[i], new Date(item.date)));

			if (findIndex !== -1) {
				list.push(data.items[findIndex]);
			} else if (i === 0) {
				list.push({ date: rangeMonthArray[i].toISOString(), balance: 0 });
			} else {
				list.push({ date: rangeMonthArray[i].toISOString(), balance: list[i - 1].balance });
			}
		}

		return { ...data, items: list };
	}
}
