import { ComponentStore } from '@ngrx/component-store';
import { TradeAccounts, TradeSources, TradeToken, TradeTokenSource } from './types';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { DataAccess, Response } from 'types/response';

interface Api {
	getSources(): Observable<Response<TradeSources>>;
	getToken(sourceId: number): Observable<Response<TradeToken>>;
	getAccounts(sourceId: number): Observable<Response<TradeAccounts>>;
	changeToken(data: TradeTokenSource): Observable<Response<TradeToken | null>>;
	removeToken(data: TradeToken): Observable<Response<TradeToken | null>>;
}

interface TradeStoreBrokerState {
	accounts: TradeBrokerAccounts;
	sources: DataAccess<TradeSources>;
	token: TradeBrokerToken;
}

export type TradeBrokerAccounts = DataAccess<TradeAccounts> & { message: string | null };

export type TradeBrokerToken = DataAccess<TradeToken> & { message: string | null };

export class TradeBrokerStore extends ComponentStore<TradeStoreBrokerState> {
	static defaultState: TradeStoreBrokerState = {
		accounts: {
			data: null,
			message: 'Не добавлен токен источника',
			isLoaded: false,
			isLoading: false,
		},
		sources: {
			data: null,
			isLoaded: false,
			isLoading: false,
		},
		token: {
			data: null,
			isLoaded: false,
			isLoading: false,
			message: null,
		},
	};

	readonly source$: Observable<DataAccess<TradeSources>> = this.select((state: TradeStoreBrokerState) => state.sources);
	readonly token$: Observable<TradeBrokerToken> = this.select((state: TradeStoreBrokerState) => state.token);
	readonly accounts$: Observable<TradeBrokerAccounts> = this.select((state: TradeStoreBrokerState) => state.accounts);

	constructor(private _api: Api) {
		super(TradeBrokerStore.defaultState);
	}

	readonly updateSources = this.updater(
		(state: TradeStoreBrokerState, sources: null | TradeSources): TradeStoreBrokerState => ({
			...state,
			sources: {
				data: sources,
				isLoading: false,
				isLoaded: true,
			},
		})
	);

	readonly updateSourcesLoading = this.updater(
		(state: TradeStoreBrokerState, isLoading: boolean): TradeStoreBrokerState => ({
			...state,
			sources: {
				...state.sources,
				isLoading,
			},
		})
	);

	readonly updateToken = this.updater(
		(
			state: TradeStoreBrokerState,
			token: { data: TradeToken | null; message: string | null }
		): TradeStoreBrokerState => ({
			...state,
			token: {
				data: token.data,
				message: token.message,
				isLoading: false,
				isLoaded: true,
			},
		})
	);

	readonly updateTokenLoading = this.updater(
		(state: TradeStoreBrokerState, isLoading: boolean): TradeStoreBrokerState => ({
			...state,
			token: {
				...state.token,
				isLoading,
			},
		})
	);

	readonly updateAccounts = this.updater(
		(
			state: TradeStoreBrokerState,
			accounts: { data: TradeAccounts | null; message: string | null }
		): TradeStoreBrokerState => ({
			...state,
			accounts: {
				data: accounts.data,
				message: accounts.message,
				isLoaded: true,
				isLoading: false,
			},
		})
	);

	readonly updateAccountsLoading = this.updater(
		(state: TradeStoreBrokerState, isLoading: boolean): TradeStoreBrokerState => ({
			...state,
			accounts: {
				...state.accounts,
				isLoading,
			},
		})
	);

	loadSources = this.effect((stream$: Observable<void>) =>
		stream$.pipe(
			tap(() => this.updateSourcesLoading(true)),
			switchMap(() => this._api.getSources()),
			tap((response: Response<TradeSources>) => this.updateSources(response.data))
		)
	);

	loadToken = this.effect((stream$: Observable<number>) =>
		stream$.pipe(
			tap(() => this.updateTokenLoading(true)),
			switchMap((sourceId: number) => this._api.getToken(sourceId)),
			tap((response: Response<TradeToken | null>) => this.updateToken(response))
		)
	);

	loadAccounts = this.effect((stream$: Observable<number>) =>
		stream$.pipe(
			tap(() => this.updateAccountsLoading(true)),
			switchMap((sourceId: number) =>
				this._api.getAccounts(sourceId).pipe(
					catchError((error) => {
						console.error(error);

						return of({
							data: null,
							message: 'Не валидный токен источника',
							success: true,
						});
					})
				)
			),
			tap((response: Response<TradeAccounts | null>) => this.updateAccounts(response))
		)
	);

	changeToken = this.effect((stream$: Observable<TradeTokenSource>) =>
		stream$.pipe(
			tap(() => this.updateTokenLoading(true)),
			switchMap((token: TradeTokenSource) =>
				this._api.changeToken(token).pipe(
					catchError((error: Error | null) => {
						console.error(error);

						return of({
							data: null,
							message: `Ошибка изменения токена`,
							success: false,
						});
					})
				)
			),
			tap((response: Response<TradeToken | null>) => this.updateToken(response)),
			tap((response: Response<TradeToken | null>) => response.data && this.loadAccounts(response.data.sourceId))
		)
	);

	removeToken = this.effect((stream$: Observable<TradeToken>) =>
		stream$.pipe(
			tap(() => this.updateTokenLoading(true)),
			switchMap((token: TradeToken) => this._api.removeToken(token)),
			tap((response: Response<TradeToken | null>) => this.updateToken({ data: null, message: response.message })),
			tap(() => this.updateAccounts(TradeBrokerStore.defaultState.accounts))
		)
	);
}
