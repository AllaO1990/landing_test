import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { distinctUntilChanged, filter, map, Observable, switchMap } from 'rxjs';
import { TradeAccounts, TradeOrders, TradeSources } from '@data-access-trade/types';
import { ApiTradeService } from '@data-access-trade/api.service';
import { Response } from 'types/response';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';
import { Params } from '@angular/router';
import { TuiButton, TuiFormatNumberPipe } from '@taiga-ui/core';
import { DirectionTypePipe } from '../../../../src/lib/common/direction-type.pipe';
import { OrderTypePipe } from '../../../../src/lib/common/order-type.pipe';
import { StockPosition } from 'types/position';
import { StockInstrument } from 'types/stock';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';

@Component({
	selector: 'trade-view',
	imports: [AsyncPipe, NgTemplateOutlet, TuiFormatNumberPipe, DirectionTypePipe, OrderTypePipe, TuiButton],
	templateUrl: './view.component.html',
	styleUrl: './view.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent {
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #idea: IdeaFacade = inject(IdeaFacade);
	readonly #localStorage = inject(LOCAL_STORAGE);
	readonly #api: ApiTradeService = inject(ApiTradeService);
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

	readonly instrument$: Observable<StockInstrument> = this.#idea.idea$.pipe(
		distinctUntilChanged((a, b) => a.idea.id === b.idea.id),
		map((position: StockPosition) => position.idea.instrument)
	);

	readonly sources$: Observable<TradeSources> = this.#api.getSources().pipe(
		takeUntilDestroyed(this.#destroyRef),
		filter((sources: Response<TradeSources>) => sources && sources.data.length > 0),
		map((sources: Response<TradeSources>) => sources.data)
	);

	readonly params$: Observable<Params> = this.sources$.pipe(
		switchMap((sources: TradeSources) =>
			this._getAccounts(sources[0].id).pipe(
				switchMap((accounts: TradeAccounts) =>
					this.instrument$.pipe(
						map((instrument) => ({
							accountId: accounts[0].accountId,
							instrumentId: instrument.id,
							sourceId: sources[0].id,
						}))
					)
				)
			)
		)
	);

	readonly orders$: Observable<TradeOrders> = this._getOrders().pipe(
		map((response: Response<TradeOrders>) => response.data)
	);
	readonly stopOrders$: Observable<TradeOrders> = this._getStopOrders().pipe(
		map((response: Response<TradeOrders>) => response.data)
	);

	private _getOrders(): Observable<Response<TradeOrders>> {
		const filterTrade = this.#localStorage.getItem('filterTrade');

		if (filterTrade.account && filterTrade.source) {
			return this.instrument$.pipe(
				takeUntilDestroyed(this.#destroyRef),
				switchMap((instrument) =>
					this.#api.getOrders({
						accountId: filterTrade.account.accountId,
						instrumentId: instrument.id,
						sourceId: filterTrade.source.id,
					})
				)
			);
		}

		console.log(this.params$);

		return this.params$.pipe(switchMap((params: Params) => this.#api.getOrders(params)));
	}

	private _getStopOrders(): Observable<Response<TradeOrders>> {
		const filterTrade = this.#localStorage.getItem('filterTrade');

		if (filterTrade.account && filterTrade.source) {
			return this.instrument$.pipe(
				takeUntilDestroyed(this.#destroyRef),
				switchMap((instrument) =>
					this.#api.getStopOrders({
						accountId: filterTrade.account.accountId,
						instrumentId: instrument.id,
						sourceId: filterTrade.source.id,
					})
				)
			);
		}

		return this.params$.pipe(switchMap((params: Params) => this.#api.getStopOrders(params)));
	}

	private _getAccounts(id: number): Observable<TradeAccounts> {
		return this.#api.getAccounts(id).pipe(
			filter((accounts: Response<TradeAccounts>) => accounts && accounts.data.length > 0),
			map((accounts: Response<TradeAccounts>) => accounts.data)
		);
	}

	onTrade(event: Event) {
		event.preventDefault();

		this.#queryParams.update({
			trade: 'visible',
		});
	}
}
