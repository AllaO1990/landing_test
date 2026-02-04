import {AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject} from '@angular/core';
import {combineLatest, distinctUntilChanged, filter, map, Observable, shareReplay, switchMap} from 'rxjs';
import {
  TradeAccounts,
  TradeOrder,
  TradeOrders,
  TradeSources,
  TradeStopOrder,
  TradeStopOrders,
} from '@data-access-trade/types';
import {Response} from 'types/response';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {IdeaFacade} from 'stores/facades/idea.facade';
import {LOCAL_STORAGE} from 'tokens/desktop/local-storage';
import {TuiButton, TuiFormatNumberPipe} from '@taiga-ui/core';
import {DirectionTypePipe} from '../../../../src/lib/common/direction-type.pipe';
import {OrderTypePipe} from '../../../../src/lib/common/order-type.pipe';
import {StockPosition} from 'types/position';
import {StockInstrument} from 'types/stock';
import {QueryParams} from 'utils/query-params';
import {QUERY_PARAMS} from 'tokens/desktop';
import {TuiButtonLoading} from '@taiga-ui/kit';
import {TradeStore} from '@data-access-trade/store.trade';
import {FormControl, FormGroup} from '@angular/forms';
import {getNumberPrecision} from 'utils/get-number-precision';

interface FormValue {
	accountId: string;
	sourceId: number;
	positionType: string | null;
	instrument: StockInstrument;
}

@Component({
	selector: 'trade-view',
	imports: [
		AsyncPipe,
		NgTemplateOutlet,
		TuiFormatNumberPipe,
		DirectionTypePipe,
		OrderTypePipe,
		TuiButton,
		TuiButtonLoading,
	],
	templateUrl: './view.component.html',
	styleUrl: './view.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent implements AfterViewInit {
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #tradeStore: TradeStore = inject(TradeStore);
	readonly #idea: IdeaFacade = inject(IdeaFacade);
	readonly #localStorage = inject(LOCAL_STORAGE);
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

	readonly formGroup: FormGroup = new FormGroup({
		accountId: new FormControl<string | null>(null),
		instrument: new FormControl<StockInstrument | null>(null),
		sourceId: new FormControl<number | null>(null),
		positionType: new FormControl<string | null>(null),
	});

	get controlInstrument(): FormControl {
		return this.formGroup.get('instrument') as FormControl;
	}

	get controlPositionType(): FormControl {
		return this.formGroup.get('positionType') as FormControl;
	}

	readonly idea$: Observable<StockPosition> = this.#idea.idea$.pipe(
		distinctUntilChanged((a, b) => a.idea.id === b.idea.id)
	);

	readonly orders$ = this.#tradeStore.orders$.pipe(
		map((list: TradeOrders | null) => this._updateOrders(list)),
		shareReplay({ bufferSize: 1, refCount: true })
	);
	readonly stopOrders$ = this.#tradeStore.stopOrders$.pipe(
		map((list: TradeStopOrders | null) => this._updateStopOrders(list)),
		shareReplay({ bufferSize: 1, refCount: true })
	);
	readonly common$ = combineLatest([this.orders$, this.stopOrders$]).pipe(
		map(([orders, stopOrders]) => {
			const arrayOrders = orders || [];
			const arrayStopOrders = stopOrders || [];

			return [...arrayOrders, ...arrayStopOrders];
		})
	);

	readonly entry$: Observable<Array<any>> = this.controlPositionType.valueChanges.pipe(
		map((positionType: string | null) => positionType === 'long'),
		switchMap((positionType: boolean) =>
			this.common$.pipe(map((list: any[]) => list.filter((item: any) => !!item.direction === positionType)))
		)
	);

	readonly out$: Observable<Array<any>> = this.controlPositionType.valueChanges.pipe(
		map((positionType: string | null) => positionType !== 'long'),
		switchMap((positionType: boolean) =>
			this.common$.pipe(map((list: any[]) => list.filter((item: any) => !!item.direction === positionType)))
		)
	);

	ngAfterViewInit(): void {
		const filterTrade = this.#localStorage.getItem('filterTrade');

		if (filterTrade && filterTrade.account && filterTrade.source) {
			this.idea$
				.pipe(
					takeUntilDestroyed(this.#destroyRef),
					map((idea: StockPosition) => ({
						accountId: filterTrade.account.accountId,
						instrument: idea.idea.instrument,
						positionType: idea.idea.positionType,
						sourceId: filterTrade.source.id,
					}))
				)
				.subscribe((value: FormValue) => this._load(value));

			return;
		}

		combineLatest([
			this.#tradeStore.source$.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter((source: TradeSources | null): source is TradeSources => source !== null && source.length > 0)
			),
			this.#tradeStore.accounts$.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter(
					(accounts: Response<TradeAccounts | null> | null): accounts is Response<TradeAccounts | null> => accounts !== null
				),
				map((accounts: Response<TradeAccounts | null>) => accounts.data),
				filter((accounts: TradeAccounts | null): accounts is TradeAccounts => accounts !== null && accounts.length > 0)
			),
			this.idea$.pipe(takeUntilDestroyed(this.#destroyRef)),
		])
			.pipe(
				map(([sources, accounts, idea]: [TradeSources, TradeAccounts, StockPosition]) => ({
					accountId: accounts[0].accountId,
					instrument: idea.idea.instrument,
					positionType: idea.idea.positionType,
					sourceId: sources[0].id,
				}))
			)
			.subscribe((value: FormValue) => this._load(value));

		this.#tradeStore.source$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter((source: TradeSources | null): source is TradeSources => source !== null && source.length > 0)
			)
			.subscribe((sources: TradeSources) => {
				this.#tradeStore.loadAccounts(sources[0].id);
			});

		this.#tradeStore.loadSources();
	}

	onTrade(event: Event) {
		event.preventDefault();

		this.#queryParams.update({
			trade: 'visible',
		});
	}

	onRemove(event: Event, item: any): void {
		event.preventDefault();

		const value = this.formGroup.value;

		if (item.orderType && value) {
			const { accountId, sourceId, instrument } = value;

			item['removed'] = true;

			if (this.#tradeStore.isOrder(item.orderTypeText)) {
				this.#tradeStore.removeOrder({
					accountId,
					id: item.id,
					sourceId,
					instrumentId: instrument.id,
				});
			}

			if (this.#tradeStore.isStopOrder(item.orderTypeText)) {
				this.#tradeStore.removeStopOrder({
					accountId,
					id: item.stopOrderId,
					sourceId,
					instrumentId: instrument.id,
				});
			}
		}
	}

	private _load(value: FormValue): void {
		this.formGroup.patchValue(value);

		this.#tradeStore.loadOrders({
			accountId: value.accountId,
			instrumentId: value.instrument.id,
			sourceId: value.sourceId,
		});
	}

	private _updateOrders(
		list: TradeOrders | null
	): Array<TradeOrder & { removed: boolean; quantity: number; priceOrder: number; currencySymbol: string }> | null {
		if (list === null) {
			return null;
		}

		const { lot, currencySymbol } = this.controlInstrument.value;

		return list.map((item) => {
			return {
				...item,
				currencySymbol,
				priceOrder: item.initialSecurityPrice.value,
				total: getNumberPrecision(lot * item.lotsRequested * item.initialSecurityPrice.value, 2),
				removed: false,
				quantity: lot * item.lotsRequested,
			};
		});
	}

	private _updateStopOrders(
		list: TradeStopOrders | null
	): Array<TradeStopOrder & { removed: boolean; quantity: number; priceOrder: number; currencySymbol: string }> | null {
		if (list === null) {
			return null;
		}

		const { lot, currencySymbol } = this.controlInstrument.value;

		return list.map((item) => {
			const price = item.price.value || item.stopPrice.value;

			return {
				...item,
				currencySymbol,
				priceOrder: price,
				total: getNumberPrecision(lot * item.lotsRequested * price, 2),
				removed: false,
				quantity: lot * item.lotsRequested,
			};
		});
	}
}
