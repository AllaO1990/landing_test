import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { TuiBreakpointService, TuiButton } from '@taiga-ui/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TradeStore } from '@data-access-trade/store.trade';
import {
	BehaviorSubject,
	combineLatest,
	distinctUntilChanged,
	filter,
	map,
	Observable,
	pairwise,
	shareReplay,
	startWith,
	Subject,
	switchMap,
	tap,
	timer,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValue } from '../form/form.types';
import { TradePortfolio, TradeStopOrder, TradeStopOrders } from '@data-access-trade/types';
import { TradeStopOrderTypeText } from '@data-access-trade/order.types';
import { TuiButtonLoading } from '@taiga-ui/kit';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { TradeMobileFormComponent } from '../form/mobile/form.component';
import { TradeDesktopFormComponent } from '../form/desktop/form.component';
import { DataAccess } from 'types/response';
import { ApiTradeService } from '@data-access-trade/api.service';
import { StockPosition } from 'types/position';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { TradeJournalStatus } from 'types/trade';

const filtered = (list: { status: string }[]) =>
	list.reduce(
		(acc: { executed: { status: string }[]; other: { status: string }[] }, item: { status: string }) => {
			if (item.status === TradeJournalStatus.EXECUTED) {
				acc.executed.push(item);

				return acc;
			}

			acc.other.push(item);

			return acc;
		},
		{ executed: [], other: [] }
	);

interface SourceValue {
	entry: ControlValue[];
	out: ControlValue[];
	stop: ControlValue[];
}

@Component({
	selector: 'trade-layout',
	standalone: true,
	imports: [
		TuiButton,
		ReactiveFormsModule,
		AsyncPipe,
		TuiButtonLoading,
		TradeMobileFormComponent,
		TradeDesktopFormComponent,
	],
	templateUrl: './layout.component.html',
	styleUrls: ['../common/dialog.scss', './layout.component.scss'],
	providers: [
		ApiTradeService,
		{
			provide: TradeStore,
			useFactory: (api: ApiTradeService) => new TradeStore(api),
			deps: [ApiTradeService],
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit, OnDestroy {
	readonly #breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #store: TradeStore = inject(TradeStore);
	readonly #idea: IdeaFacade = inject(IdeaFacade);
	readonly #api: ApiTradeService = inject(ApiTradeService);
	readonly #isSubmitted$: Subject<boolean> = new BehaviorSubject<boolean>(false);
	readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

	loading = false;

	readonly #idea$: Observable<StockPosition> = this.#idea.idea$;

	readonly isMobile$: Observable<boolean> = this.#breakpoint$.pipe(
		map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile'),
		shareReplay({ refCount: true, bufferSize: 1 })
	);

	readonly formGroup: FormGroup = new FormGroup({
		trade: new FormControl(null),
	});

	readonly sourceValueChanges$: Observable<SourceValue> = this.formGroup.valueChanges.pipe(
		startWith(this.formGroup.value),
		map((value) => value.trade),
		filter((value: SourceValue | null): value is SourceValue => value !== null)
	);

	/**
	 * Необходимо снимать STOP_ORDER_TYPE_STOP_LOSS (Stop-loss) заявку если она есть в брокере
	 * Условие:
	 * 1 - Заявки входа - испольнены, заявки выхода - исполнены
	 * 2 - количество лотов входа = количеству лотов
	 * */
	readonly isCloseStopLoss$: Observable<boolean> = this.sourceValueChanges$.pipe(
		filter((value: SourceValue) => {
			const entryIndex = value.entry.findIndex((item) => item.status === TradeJournalStatus.UNLOADING);
			const outIndex = value.out.findIndex((item) => item.status === TradeJournalStatus.UNLOADING);

			return entryIndex === -1 && outIndex === -1;
		}),
		map((value: SourceValue) => {
			const entryLots = value.entry.reduce((acc, item) => (acc += item.lots), 0);
			const outLots = value.out.reduce((acc, item) => (acc += item.lots), 0);

			return entryLots === outLots;
		}),
		distinctUntilChanged()
	);

	/**
	 * return boolean;
	 * Проверяем в entry, out, stop хотя бы одна заявка со статусом "не отправлена брокеру" (UNLOADING)
	 * Если где-то есть UNLOADING => false, нет => true
	 * */
	readonly isUnloading$: Observable<boolean> = this.formGroup.valueChanges.pipe(
		startWith(this.formGroup.value),
		map((value) => value.trade),
		filter((value) => value !== null),
		map((value) => ({ entry: value.entry, out: value.out, stop: value.stop })),
		map(
			({
				entry,
				out,
				stop,
			}: {
				entry: { status: TradeJournalStatus }[];
				out: { status: TradeJournalStatus }[];
				stop: { status: TradeJournalStatus }[];
			}) => {
				if (!entry || !out || !stop) {
					return true;
				}
				if (entry.length === 0 && out.length === 0 && stop.length === 0) {
					return true;
				}

				const entryIndex = entry.findIndex((item) => item.status === TradeJournalStatus.UNLOADING);
				const outIndex = out.findIndex((item) => item.status === TradeJournalStatus.UNLOADING);
				const stopIndex = stop.findIndex((item) => item.status === TradeJournalStatus.UNLOADING);

				return entryIndex === -1 && outIndex === -1 && stopIndex === -1;
			}
		),
		distinctUntilChanged(),
		tap((flag) => {
			if (flag) {
				this.loading = false;
			}
		})
	);

	readonly isDisabled$: Observable<boolean> = combineLatest([this.isUnloading$]).pipe(
		map(([isUnloading]: [boolean]) => isUnloading),
		distinctUntilChanged()
	);

	#isStop$: Observable<ControlValue> = this.formGroup.valueChanges.pipe(
		takeUntilDestroyed(this.#destroyRef),
		map((value: { trade: { entry: ControlValue[]; stop: ControlValue[] } }) => ({
			entry: value.trade.entry,
			stop: value.trade.stop,
		})),
		filter(
			({ entry, stop }: { entry: ControlValue[]; stop: ControlValue[] }) =>
				entry && entry.length > 0 && stop && stop.length > 0
		),
		filter(
			({ entry }: { entry: ControlValue[]; stop: ControlValue[] }) => entry[0].status === TradeJournalStatus.EXECUTED
		),
		map(({ entry, stop }: { entry: ControlValue[]; stop: ControlValue[] }) => ({ entry: entry[0], stop: stop[0] })),
		distinctUntilChanged((a, b) => this._distinct(a, b)),
		map(({ stop }: { stop: ControlValue }) => stop)
	);

	ngAfterViewInit(): void {
		// this.#store.stopOrders$
		// 	.pipe(
		// 		takeUntilDestroyed(this.#destroyRef),
		// 		filter(
		// 			(stopOrders: TradeStopOrders | null): stopOrders is TradeStopOrders => stopOrders !== null && stopOrders.length > 0
		// 		),
		// 		switchMap((stopOrders: TradeStopOrders) =>
		// 			this.isCloseStopLoss$.pipe(
		// 				filter((status: boolean) => status),
		// 				map(() => stopOrders)
		// 			)
		// 		)
		// 	)
		// 	.subscribe((stopOrders: TradeStopOrders) => {
		// 		const {
		// 			filter: { account, instrument, source },
		// 		} = this.formGroup.value.trade;
		//
		// 		console.log('removeStopOrder', stopOrders);
		//
		// 		// this.#store.removeStopOrder({
		// 		// 	accountId: account.accountId,
		// 		// 	id: stopOrders[0].stopOrderId,
		// 		// 	sourceId: source.id,
		// 		// 	instrumentId: instrument.id,
		// 		// });
		// 	});

		this.#isSubmitted$
			.asObservable()
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter((isSubmitted: boolean) => isSubmitted),
				switchMap(() =>
					this.formGroup.valueChanges.pipe(
						switchMap((value) => timer(100).pipe(map(() => value))),
						startWith(this.formGroup.value),
						map((value: { trade: { entry: ControlValue[] } }): ControlValue[] => value.trade.entry),
						pairwise(),
						filter(
							([first, second]: [ControlValue[], ControlValue[]]) =>
								(!first || !first[0] || (first[0] && first[0].status !== TradeJournalStatus.EXECUTED)) &&
								second &&
								second[0] &&
								second[0].status === TradeJournalStatus.EXECUTED
						),
						map((data: [ControlValue[], ControlValue[]]) => data[1])
					)
				)
			)
			.subscribe(() => {
				console.log('submitted');

				// const {
				// 	filter: { account, instrument, source },
				// 	out,
				// 	stop,
				// } = this.formGroup.value.trade;
				//
				// if (account && instrument && source) {
				// 	const outOrders = this._getOrders(
				// 		[...out, ...stop].filter((item: { status: ControlValueStatus }) => item.status === ControlValueStatus.UNLOADING),
				// 		account.accountId,
				// 		instrument.id,
				// 		source.id
				// 	);
				//
				// 	if (outOrders.length > 0) {
				// 		this.#store.addOrders(outOrders);
				// 	}
				// }
			});

		this.#isStop$
			.pipe(
				switchMap((value: ControlValue) =>
					this.#store.stopOrders$.pipe(
						takeUntilDestroyed(this.#destroyRef),
						filter((list: TradeStopOrders | null): list is TradeStopOrders => list !== null),
						map((list: TradeStopOrders) =>
							list.filter((item: TradeStopOrder) => item.orderTypeText === TradeStopOrderTypeText.STOP_ORDER_TYPE_STOP_LOSS)
						),
						tap(() => console.log('stop stop stop stop stop stop stop stop')),
						filter(
							(list: TradeStopOrders) =>
								list.length > 0 && list.findIndex((item: TradeStopOrder) => item.lotsRequested !== value.lots) !== -1
						)
					)
				)
			)
			.subscribe((orders: TradeStopOrders) => {
				const {
					filter: { account, instrument, source },
				} = this.formGroup.value.trade;

				console.log('removeStopOrder');

				// this.#store.removeStopOrder({
				// 	accountId: account.accountId,
				// 	id: orders[0].stopOrderId,
				// 	sourceId: source.id,
				// 	instrumentId: instrument.id,
				// });
			});

		this.#isStop$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter((value: ControlValue) => value.status === TradeJournalStatus.UNLOADING),
				switchMap((value: ControlValue) =>
					this.#store.portfolio$.pipe(
						map((response: DataAccess<TradePortfolio> | null) => response && response.data),
						filter((portfolio: TradePortfolio | null) => portfolio !== null),
						filter((portfolio: TradePortfolio) => portfolio.positions.length > 0 && portfolio.positions[0].quantity !== 0),
						map((portfolio: TradePortfolio) => {
							const position = portfolio.positions[0];

							return position.averagePositionPrice.value * position.quantity;
						}),
						distinctUntilChanged(),
						map(() => value)
					)
				)
			)
			.subscribe((controlValue: ControlValue) => {
				const {
					filter: { account, instrument, source },
				} = this.formGroup.value.trade;

				console.log('addStopOrder', account, instrument, source);

				// this.#store.addStopOrder(this._getOrder(controlValue, account.accountId, instrument.id, source.id));
			});
	}

	ngOnDestroy(): void {
		this.#isSubmitted$.complete();
	}

	onClose(event: Event): void {
		event.preventDefault();

		this.#context.completeWith('isUpdate');
	}

	onSubmit(event: Event): void {
		event.preventDefault();

		if (this.loading) {
			return;
		}

		this.loading = true;

		const { idea, position, entry, out, stop, filter } = this.formGroup.getRawValue().trade;

		const entries = entry.filter((item: { status: string }) => item.status === TradeJournalStatus.EXECUTED);
		const outs = out.filter((item: { status: string }) => item.status === TradeJournalStatus.EXECUTED);

		const positionUpdate = {
			actions: {
				entries: entries.map((item: any) => ({
					amount: item.quantity,
					brokerId: item.brokerId,
					date: item.expireDate,
					price: item.price,
				})),
				outs: outs.map((item: any) => ({
					amount: item.quantity,
					brokerId: item.brokerId,
					date: item.expireDate,
					price: item.price,
				})),
			},
			comissions: position.comissions.map((item: any) => ({
				brokerId: item.brokerId,
				comment: item.comment,
				date: item.date,
				size: item.size,
				id: item.id,
			})),
			dividends: position.dividends.map((item: any) => ({
				amount: item.amount,
				brokerId: item.brokerId,
				date: item.date,
				size: item.size,
			})),
			idea: {
				amount: idea.entry[0].quantity,
				entry: idea.entry[0].price,
				goals: idea.out.map((item: any) => ({
					amount: item.amount,
					goal: item.price,
				})),
				instrumentId: position.idea.instrument.id,
				parentId: position.idea.parentId,
				portfolioId: position.idea.portfolioId,
				positionType: position.idea.positionType,
				strategyId: position.idea.strategy!.id,
				stop: idea.stop[0].price,
				watch: true,
			},
		};

		this.#idea.editIdea({
			id: position.idea.id!,
			body: positionUpdate,
		});

		this.#store.setJournalItems([...entry, ...out, ...stop]);

		// const entryUnloadingOrders: TradeJournal[] = entry.filter(
		// 	(item: TradeJournal) => item.status === ControlValueStatus.UNLOADING
		// );
		//
		// if (entryUnloadingOrders.length > 0) {
		// 	this.#store.addOrders(entryUnloadingOrders);
		//
		// 	return;
		// }

		//
		// const outOrders = this._getOrders(
		// 	out.filter((item: { status: ControlValueStatus }) => item.status === ControlValueStatus.UNLOADING),
		// 	account.accountId,
		// 	instrument.id,
		// 	source.id
		// );
		//
		// const stopOrders = this._getOrders(
		// 	stop.filter((item: { status: ControlValueStatus }) => item.status === ControlValueStatus.UNLOADING),
		// 	account.accountId,
		// 	instrument.id,
		// 	source.id
		// );
		//
		// const common = [...outOrders, ...stopOrders];
		//
		// if (common.length > 0) {
		// 	this.#store.addOrders(common);
		// }
	}

	private _getOrder(controlValue: ControlValue, accountId: string, instrumentId: string, sourceId: number): any {
		const { total, quantity, lots, lot, ...order } = controlValue;

		return {
			...order,
			quantity: lots,
			// quantity: getNumberPrecision(quantity / lot, 0),
			lot,
			accountId,
			instrumentId,
			sourceId,
		};
	}

	private _getOrders(orders: any[], accountId: string, instrumentId: string, sourceId: number): any[] {
		return orders.map((item: ControlValue) => this._getOrder(item, accountId, instrumentId, sourceId));
	}

	private _distinct(
		a: { entry: ControlValue; stop: ControlValue },
		b: {
			entry: ControlValue;
			stop: ControlValue;
		}
	): boolean {
		if (!this._distinctControlValue(a.entry, b.entry)) {
			return false;
		}

		return this._distinctControlValue(a.stop, b.stop);
	}

	private _distinctControlValue(a: ControlValue, b: ControlValue): boolean {
		return (
			a.status === b.status &&
			a.price === b.price &&
			a.stopPrice === b.stopPrice &&
			a.lots === b.lots &&
			a.expirationType?.id === b.expirationType?.id &&
			a.orderType?.id === b.orderType?.id
		);
	}
}
