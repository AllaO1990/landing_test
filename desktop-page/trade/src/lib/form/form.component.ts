import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	forwardRef,
	inject,
	Injector,
	OnDestroy,
	signal,
	WritableSignal,
} from '@angular/core';
import { HeaderComponent, UiList, UiListItem } from '@ui/components/list';
import { TuiButtonLoading, TuiCheckbox, TuiChevron } from '@taiga-ui/kit';
import {
	AbstractControl,
	ControlValueAccessor,
	FormArray,
	FormControl,
	FormGroup,
	NG_VALUE_ACCESSOR,
	ReactiveFormsModule,
} from '@angular/forms';
import { TuiBreakpointService, TuiButton, TuiFormatNumberPipe, TuiHint, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { TuiExpand } from '@taiga-ui/experimental';
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { FilterComponent } from '../filter/filter.component';
import { IdeaFacade } from 'stores/facades/idea.facade';
import {
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	finalize,
	map,
	Observable,
	pairwise,
	shareReplay,
	startWith,
	switchMap,
	tap,
	timer,
} from 'rxjs';
import {
	StockPosition,
	StockPositionActionEntry,
	StockPositionActionTarget,
	StockPositionIdeaEntry,
	StockPositionStop,
	StockPositionTarget,
} from 'types/position';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiTradeService } from '@data-access-trade/api.service';
import { TradeStore } from '@data-access-trade/store.trade';
import { DirectionTypePipe } from '@data-access-trade/direction-type.pipe';
import { OrderTypePipe } from '@data-access-trade/order-type.pipe';
import {
	TradeAccount,
	TradeLimit,
	TradeOperation,
	TradeOperations,
	TradeOrder,
	TradeOrders,
	TradePortfolio,
	TradeSource,
	TradeStopOrder,
	TradeStopOrders,
	TradeToken,
} from '@data-access-trade/types';
import { getNumberPrecision } from 'utils/get-number-precision';
import { RequestFormValue } from '../request/request.component';
import { TradeFormService } from './form.service';
import { TuiItem, TuiPopover } from '@taiga-ui/cdk';
import { ControlValue } from './form.types';
import { DetailsComponent } from '../details/details.component';
import { Params } from '@angular/router';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { DataAccess, Response } from 'types/response';
import { TradeFormDialogService } from './form.dialog.service';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { TIMER_INTERVAL } from 'tokens/desktop/timer-interval';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import {
	calculateEntries,
	calculateStop,
	calculateTargets,
	transformEntries,
	transformTargets,
} from 'utils/idea-calculate';
import {
	TRADE_ORDER_TYPE_LIMIT,
	TRADE_ORDER_TYPE_MARKET,
	TRADE_STOP_ORDER_TYPE_STOP_LOSS,
	TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
} from '@data-access-trade/order.constants';
import { StockInstrument } from 'types/stock';
import { TradeJournal, TradeJournalStatus, TradeJournalSystem } from 'types/trade';
import { StockPositionType } from 'types/stock-position-type';
import { getPriceIncrement } from 'utils/get-price-increment';

interface DefaultIdea {
	entry: StockPositionIdeaEntry[];
	out: StockPositionTarget[];
	stop: StockPositionStop[];
}

const accumFn = <T, K extends keyof T>(list: T[], key: K): number =>
	list.reduce((acc: number, item: T): number => (acc += item[key] as number), 0);

@Component({
	selector: 'trade-form',
	standalone: true,
	imports: [
		UiList,
		HeaderComponent,
		UiListItem,
		TuiCheckbox,
		ReactiveFormsModule,
		TuiButton,
		NgTemplateOutlet,
		TuiIcon,
		AsyncPipe,
		TuiFormatNumberPipe,
		FilterComponent,
		TuiScrollbar,
		DirectionTypePipe,
		OrderTypePipe,
		TuiButtonLoading,
		TuiHint,
		TuiExpand,
		TuiChevron,
		TuiItem,
		DetailsComponent,
		DatePipe,
	],
	templateUrl: './form.component.html',
	styleUrl: './form.component.scss',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => TradeFormComponent),
			multi: true,
		},
		{
			provide: TradeFormDialogService,
			useFactory: (dialog: DialogService) => new TradeFormDialogService(dialog),
			deps: [DIALOG],
		},
		TradeFormService,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeFormComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
	readonly #breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);
	readonly #injector: Injector = inject(Injector);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #dialog: TradeFormDialogService = inject(TradeFormDialogService);
	readonly #idea: IdeaFacade = inject(IdeaFacade);
	readonly #store: TradeStore = inject(TradeStore);
	readonly #service: TradeFormService = inject(TradeFormService);
	readonly #api: ApiTradeService = inject(ApiTradeService);
	readonly #timerInterval: number = inject(TIMER_INTERVAL);
	readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

	readonly isMobile$: Observable<boolean> = this.#breakpoint$.pipe(
		map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile'),
		shareReplay({ refCount: true, bufferSize: 1 })
	);

	readonly expandedFilter: WritableSignal<boolean> = signal(false);
	readonly expandedFilterDisabled: WritableSignal<boolean> = signal(false);

	readonly expanded: WritableSignal<boolean> = signal(false);
	readonly expandedDisabled$: Observable<boolean> = combineLatest([
		this.#store.operations$.pipe(),
		this.#store.orders$.pipe(),
	]).pipe(
		map(([operations, orders]: [TradeOperations | null, TradeOrders | null]) => !(orders || operations)),
		distinctUntilChanged(),
		startWith(true)
	);

	#onChange = (_: any) => {};
	#onTouched = () => {};

	readonly controlAuto: FormControl<boolean> = new FormControl(true, { nonNullable: true });
	readonly formGroup: FormGroup = new FormGroup({
		position: new FormControl<StockPosition | null>(null),
		idea: new FormControl<DefaultIdea | null>(null),
		filter: new FormControl(null),
		entry: new FormArray([]),
		out: new FormArray([]),
		stop: new FormArray([]),
		remove: new FormArray([]),
		auto: new FormControl(true, { nonNullable: true }),
		isNew: new FormControl(true),
	});

	get controlIsNew(): FormControl {
		return this.formGroup.get('isNew') as FormControl;
	}

	get controlPosition(): FormControl<StockPosition> {
		return this.formGroup.get('position') as FormControl;
	}

	get controlIdea(): FormControl {
		return this.formGroup.get('idea') as FormControl;
	}

	get formArrayRemove(): FormArray {
		return this.formGroup.get('remove') as FormArray;
	}

	get formArrayEntry(): FormArray {
		return this.formGroup.get('entry') as FormArray;
	}

	get formArrayOut(): FormArray {
		return this.formGroup.get('out') as FormArray;
	}

	get formArrayStop(): FormArray {
		return this.formGroup.get('stop') as FormArray;
	}

	get controlFilter(): FormControl {
		return this.formGroup.get('filter') as FormControl;
	}

	filter$: Observable<Params> = this.controlFilter.valueChanges.pipe(
		takeUntilDestroyed(this.#destroyRef),
		map((value: { source: TradeSource; account: TradeAccount; instrument: StockInstrument }) => ({
			sourceId: value.source && value.source.id,
			accountId: value.account && value.account.accountId,
			instrumentId: value.instrument && value.instrument.id,
		})),
		filter((value) => value.accountId !== null && value.instrumentId !== null && value.sourceId !== null),
		distinctUntilChanged(this._distinct),
		shareReplay({ refCount: true, bufferSize: 1 })
	);

	isDisabledButton$: Observable<boolean> = this.controlFilter.valueChanges.pipe(
		map((value: null | { token: null | string }): boolean => !(value && value.token)),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	isDisabledButtonStop$: Observable<boolean> = this.isDisabledButton$.pipe(
		filter((isDisabled: boolean) => isDisabled),
		switchMap(() =>
			this.formArrayEntry.valueChanges.pipe(
				startWith(this.formArrayEntry.value),
				map((entry: ControlValue[]) => !entry.length),
				distinctUntilChanged()
			)
		)
	);

	readonly itemHeight = 28;

	readonly idea$: Observable<StockPosition> = this.#idea.idea$;
	readonly orders$: Observable<TradeOrders | null> = this.#store.orders$.pipe(
		shareReplay({ bufferSize: 1, refCount: true })
	);
	readonly stopOrders$: Observable<TradeStopOrders | null> = this.#store.stopOrders$;
	readonly operations$: Observable<TradeOperations | null> = this.#store.operations$;
	readonly portfolio$: Observable<TradePortfolio | null> = this.#store.portfolio$.pipe(
		filter((result: DataAccess<TradePortfolio>) => result.isLoaded),
		map((result: DataAccess<TradePortfolio>) => result.data),
		distinctUntilChanged()
	);
	readonly journal$: Observable<TradeJournal[] | null> = this.#store.journal$;

	readonly listEntry$: Observable<ControlValue[]> = timer(500).pipe(
		switchMap(() => this.formArrayEntry.valueChanges.pipe(startWith(this.formArrayEntry.value))),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	readonly heightEntry$: Observable<number> = combineLatest([this.listEntry$, this.isMobile$]).pipe(
		map(([list, isMobile]: [ControlValue[], boolean]) => {
			const length = ((list && list.length) || 0) + 1;
			const rate = isMobile ? 1.5 : 1;

			return (length > 3 ? 3 : length) * this.itemHeight * rate;
		}),
		distinctUntilChanged()
	);

	readonly listOut$: Observable<ControlValue[]> = timer(500).pipe(
		switchMap(() => this.formArrayOut.valueChanges.pipe(startWith(this.formArrayOut.value))),
		debounceTime(0),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	readonly heightOut$: Observable<number> = combineLatest([this.listOut$, this.isMobile$]).pipe(
		map(([list, isMobile]: [ControlValue[], boolean]) => {
			const length = ((list && list.length) || 0) + 1;
			const rate = isMobile ? 1.5 : 1;

			return (length > 4 ? 4 : length) * this.itemHeight * rate;
		}),
		distinctUntilChanged()
	);

	readonly listStop$: Observable<ControlValue[]> = timer(500).pipe(
		switchMap(() => this.formArrayStop.valueChanges.pipe(startWith(this.formArrayStop.value))),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	readonly positionAndDefaultIdea$: Observable<DefaultIdea & { position: StockPosition }> = this.idea$.pipe(
		distinctUntilChanged((a, b) => a.idea.id === b.idea.id),
		switchMap((position: StockPosition) =>
			this.#api.getLimitForCurrency(position.idea.instrument.currencyId).pipe(
				map((response: Response<TradeLimit>) => ({
					limit: response.data,
					position,
				}))
			)
		),
		map(({ position, limit }: { position: StockPosition; limit: TradeLimit }) => ({
			...this._getStartIdeaWithLimit(position, limit.limit),
			position,
		})),
		takeUntilDestroyed(this.#destroyRef),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	heightStop$: Observable<number> = combineLatest([this.listStop$, this.isMobile$]).pipe(
		map(([list, isMobile]: [ControlValue[], boolean]) => {
			const length = ((list && list.length) || 0) + 1;
			const rate = isMobile ? 1.5 : 1;

			return (length > 4 ? 4 : length) * this.itemHeight * rate;
		}),
		distinctUntilChanged()
	);

	mapOperationType: { [key: string]: string } = {
		'22': 'Продажа',
		'19': 'Комиссия',
		'15': 'Покупка',
	};

	mapOperationState: { [key: string]: string } = {
		2: 'Отмена',
		1: 'Исполнена',
	};

	ngAfterViewInit(): void {
		this.filter$
			.pipe(
				switchMap((params: Params) =>
					timer(0, this.#timerInterval).pipe(
						takeUntilDestroyed(this.#destroyRef),
						map(() => params)
					)
				)
			)
			.subscribe((params: Params) => {
				this.#store.loadJournal(params);
				this.#store.loadOrders(params);
				this.#store.loadOperations(params);
			});

		this.positionAndDefaultIdea$
			.pipe(
				tap(({ position, ...idea }: DefaultIdea & { position: StockPosition }) => {
					this.controlIdea.setValue(idea);
					this.controlPosition.setValue(position);
				}),
				switchMap(({ position, ...idea }: DefaultIdea & { position: StockPosition }) =>
					combineLatest([
						this.orders$.pipe(
							filter((orders: TradeOrders | null): orders is TradeOrders => orders !== null),
							distinctUntilChanged((a: TradeOrders, b: TradeOrders) => this._distinctOrders(a, b))
						),
						this.stopOrders$.pipe(
							filter((orders: TradeStopOrders | null): orders is TradeStopOrders => orders !== null),
							distinctUntilChanged((a: TradeStopOrders, b: TradeStopOrders) => this._distinctStopOrders(a, b))
						),
						this.operations$.pipe(
							filter((operations: TradeOperations | null): operations is TradeOperations => operations !== null),
							distinctUntilChanged((a: TradeOperations, b: TradeOperations) => a.length === b.length)
						),
						this.portfolio$.pipe(
							filter((portfolio: TradePortfolio | null): portfolio is TradePortfolio => portfolio !== null)
						),
						this.journal$,
					]).pipe(
						debounceTime(500),
						map(
							([orders, stopOrders, operations, portfolio, journal]: [
								TradeOrders,
								TradeStopOrders,
								TradeOperations,
								TradePortfolio,
								TradeJournal[] | null
							]) => {
								let common: { entry: TradeJournal[]; out: TradeJournal[]; stop: TradeJournal[] } = {
									entry: [],
									out: [],
									stop: [],
								};

								if (journal === null) {
									common = this._initControlsForIdea(position, orders, stopOrders, operations, portfolio, idea);
								} else {
									common = this._initControlsForJournal(position, journal, orders, stopOrders, operations);
									this.controlIsNew.setValue(false);
								}

								return {
									...common,
									position,
								};
							}
						)
					)
				),
				finalize(() => console.log('finalize subscribe'))
			)
			.subscribe((res: { entry: TradeJournal[]; out: TradeJournal[]; stop: TradeJournal[]; position: StockPosition }) => {
				const direction = res.position.idea.positionType === StockPositionType.LONG;

				this._updateFormArray(this.formArrayEntry, this._sortJournal(res.entry, direction));
				this._updateFormArray(this.formArrayOut, this._sortJournal(res.out, direction));
				this._updateFormArray(this.formArrayStop, this._sortJournal(res.stop, direction));

				this.#store.updateIsLoading(false);
			});

		this.controlIsNew.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlIsNew.value),
				filter((status: boolean) => !status),
				switchMap(() =>
					this.formArrayEntry.valueChanges.pipe(
						takeUntilDestroyed(this.#destroyRef),
						map((list: TradeJournal[] | null) =>
							(list || []).filter(
								(item: TradeJournal) =>
									item.status === TradeJournalStatus.UNLOADING && item.externalId !== null && item.trailingIndentType !== 0
							)
						),
						filter((list: TradeJournal[]) => list.length > 0),
						distinctUntilChanged((a, b) => this._distinctJournal(a, b)),
						debounceTime(1000)
					)
				)
			)
			.subscribe((list: TradeJournal[]) => {
				console.log('formArrayEntry', list);

				this.#store.addOrders(list);
			});

		this.controlIsNew.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlIsNew.value),
				filter((status: boolean) => !status),
				switchMap(() =>
					this.formArrayEntry.valueChanges.pipe(
						takeUntilDestroyed(this.#destroyRef),
						map((list: TradeJournal[] | null) => {
							if (list === null) {
								return false;
							}

							return list.every(
								(item: TradeJournal) =>
									item.status === TradeJournalStatus.EXECUTED && item.externalId !== null && item.trailingIndentType !== 0
							);
						}),
						filter((status: boolean) => status)
					)
				),
				switchMap(() =>
					this.formArrayOut.valueChanges.pipe(
						takeUntilDestroyed(this.#destroyRef),
						map((list: TradeJournal[] | null) =>
							(list || []).filter(
								(item: TradeJournal) =>
									item.status === TradeJournalStatus.UNLOADING && item.externalId !== null && item.trailingIndentType !== 0
							)
						),
						filter((list: TradeJournal[]) => list.length > 0),
						distinctUntilChanged((a, b) => this._distinctJournal(a, b)),
						debounceTime(1000)
					)
				)
			)
			.subscribe((list: TradeJournal[]) => {
				console.log('formArrayOut', list);

				this.#store.addOrders(list);
			});

		this.controlIsNew.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlIsNew.value),
				filter((status: boolean) => !status),
				switchMap(() =>
					this.formArrayEntry.valueChanges.pipe(
						takeUntilDestroyed(this.#destroyRef),
						map((list: TradeJournal[] | null) => {
							if (list === null) {
								return false;
							}

							return list.some(
								(item: TradeJournal) =>
									item.status === TradeJournalStatus.EXECUTED && item.externalId !== null && item.trailingIndentType !== 0
							);
						}),
						filter((status: boolean) => status)
					)
				),
				switchMap(() =>
					this.formArrayStop.valueChanges.pipe(
						takeUntilDestroyed(this.#destroyRef),
						map((list: TradeJournal[] | null) =>
							(list || []).filter(
								(item: TradeJournal) =>
									item.status === TradeJournalStatus.UNLOADING && item.externalId !== null && item.trailingIndentType !== 0
							)
						),
						filter((list: TradeJournal[]) => list.length > 0),
						distinctUntilChanged((a, b) => this._distinctJournal(a, b)),
						debounceTime(1000)
					)
				)
			)
			.subscribe((list: TradeJournal[]) => {
				console.log('formArrayStop', list);

				// this.#store.addOrders(list);
			});

		this.controlIsNew.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlIsNew.value),
				filter((status: boolean) => !status),
				switchMap(() =>
					combineLatest([
						this.formArrayEntry.valueChanges.pipe(
							takeUntilDestroyed(this.#destroyRef),
							map((list: TradeJournal[] | null) => this._getQuantityForJournal(list)),
							filter((quantity: number) => quantity !== 0)
						),
						this.formArrayOut.valueChanges.pipe(
							takeUntilDestroyed(this.#destroyRef),
							map((list: TradeJournal[] | null) => this._getQuantityForJournal(list))
						),
					]).pipe(
						map(([quantityEntry, quantityOut]: [number, number]) => quantityEntry - quantityOut),
						filter((quantity: number) => quantity >= 0),
						debounceTime(1000)
					)
				),
				switchMap((quantity: number) =>
					this.formArrayStop.valueChanges.pipe(
						takeUntilDestroyed(this.#destroyRef),
						startWith(this.formArrayStop.value),
						map((list: TradeJournal[] | null) =>
							(list || []).reduce((acc: number, item: TradeJournal) => {
								if (
									(item.status === TradeJournalStatus.AWAITS || item.status === TradeJournalStatus.UNLOADING) &&
									item.externalId !== null &&
									item.trailingIndentType !== 0
								) {
									acc += item.quantity;
								}

								return acc;
							}, 0)
						),
						distinctUntilChanged(),
						filter((quantityStop: number) => quantity - quantityStop !== 0),
						switchMap(() =>
							this.stopOrders$.pipe(
								map((stopOrders: TradeStopOrder[] | null) => (stopOrders !== null ? stopOrders : [])),
								map((stopOrders: TradeStopOrder[]) => {
									const {
										account: { accountId },
										source,
									} = this.controlFilter.value;

									return stopOrders
										.filter((item: TradeStopOrder) => this.#service.isMayBeOrderStop(item.orderTypeText))
										.map((item: TradeStopOrder) => ({ accountId, sourceId: source.id, orderId: item.stopOrderId }));
								}),
								map((stopOrders: Params[]) => ({
									stopOrders,
									quantity,
								}))
							)
						)
					)
				)
			)
			.subscribe(({ stopOrders, quantity }: { stopOrders: Params[]; quantity: number }) => {
				console.log('formArrayStop Change', quantity);

				// if (stopOrders.length > 0) {
				// 	this.#store.justRemoveBrokerStopOrder(stopOrders);
				// }
				//
				// const removed: TradeJournal[] = (this.formArrayStop.value || []).filter(
				// 	(item: TradeJournal) => item.status !== TradeJournalStatus.EXECUTED
				// );
				//
				// if (removed.length > 0) {
				// 	this.#store.justRemoveJournal(removed);
				// }

				// const {
				// 	account: { accountId },
				// 	source,
				// } = this.controlFilter.value;
				// const { stop } = this.controlIdea.value;
				// const update = this.#service.getUnloadingControlValue(
				// 	accountId,
				// 	source,
				// 	this.controlPosition.value,
				// 	stop,
				// 	TRADE_STOP_ORDER_TYPE_STOP_LOSS,
				// 	'reverse'
				// );
				//
				// this.formArrayStop.clear();
				//
				// this.#store.setJournalItems([
				// 	{
				// 		...update[0],
				// 		quantity,
				// 		lots: quantity / update[0].lot,
				// 		status: TradeJournalStatus.UNLOADING,
				// 	},
				// ]);
			});

		const token$: Observable<TradeToken | null> = this.controlFilter.valueChanges.pipe(
			takeUntilDestroyed(this.#destroyRef),
			startWith(this.controlFilter.value),
			map((value: { token: null | TradeToken } | null): TradeToken | null => value && value.token),
			distinctUntilChanged(),
			shareReplay({ bufferSize: 1, refCount: true })
		);

		this.isMobile$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter((isMobile: boolean) => !isMobile)
			)
			.subscribe(() => this.expandedFilter.update(() => true));

		this.isMobile$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter((isMobile: boolean) => isMobile),
				switchMap(() =>
					token$.pipe(
						map((token: TradeToken | null) => token === null),
						distinctUntilChanged()
					)
				),
				debounceTime(100)
			)
			.subscribe((isNoToken: boolean) => {
				this.expandedFilterDisabled.update(() => isNoToken);
				this.expandedFilter.update(() => isNoToken);
			});

		token$.pipe(pairwise()).subscribe(([first, second]: [null | TradeToken, null | TradeToken]) => {
			if (first !== null && second === null) {
				this.formArrayEntry.clear();
				this.formArrayOut.clear();
				this.formArrayStop.clear();
			}
		});

		// this.#idea.idea$
		// 	.pipe(
		// 		takeUntilDestroyed(this.#destroyRef),
		// 		switchMap((position: StockPosition) =>
		// 			this.formArrayStop.valueChanges.pipe(
		// 				takeUntilDestroyed(this.#destroyRef),
		// 				startWith(this.formArrayStop.value),
		// 				pairwise(),
		// 				filter(([prev, curr]: [ControlValue[], ControlValue[]]) => prev.length > 0 && curr.length === 0),
		// 				map(() => position)
		// 			)
		// 		)
		// 	)
		// 	.subscribe((position: StockPosition) => {
		// 		console.log(position);
		// 		// this.#idea.editIdea({
		// 		// 	id: position.idea.id!,
		// 		// 	body: this.#service.updateIdea(this.#service.getIdeaStopLossToStop(position), [], [], []),
		// 		// });
		// 	});

		// this.#idea.idea$
		// 	.pipe(
		// 		takeUntilDestroyed(this.#destroyRef),
		// 		switchMap((position: StockPosition) =>
		// 			this.formArrayStop.valueChanges.pipe(
		// 				startWith(this.formArrayStop.value),
		// 				pairwise(),
		// 				filter(([prev, curr]: [ControlValue[], ControlValue[]]) => prev.length === 0 && curr.length > 0),
		// 				map(() => position),
		// 				filter((position: StockPosition) => {
		// 					const stopPrice = position.idea.stop?.price;
		// 					const stopPriceService = this.#service.getIdeaStopLossToTarget(position).idea.stop?.price;
		//
		// 					return stopPrice !== stopPriceService;
		// 				})
		// 			)
		// 		)
		// 	)
		// 	.subscribe((position: StockPosition) => {
		// 		this.#idea.editIdea({
		// 			id: position.idea.id!,
		// 			body: this.#service.updateIdea(this.#service.getIdeaStopLossToTarget(position), [], [], []),
		// 		});
		// 	});

		this.formGroup.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.formGroup.value))
			.subscribe((value) => this.#onChange(value));
	}

	ngOnDestroy(): void {
		console.log('ngOnDestroy');
	}

	private _distinct(
		a: { accountId: string; instrumentId: string; sourceId: number },
		b: { accountId: string; instrumentId: string; sourceId: number }
	): boolean {
		return a.accountId === b.accountId && a.instrumentId === b.instrumentId && a.sourceId === b.sourceId;
	}

	writeValue(obj: any): void {
		if (obj && obj.remove && obj.remove.length === 0) {
			this.formArrayRemove.clear({ emitEvent: false });
			this.formArrayEntry.clear({ emitEvent: false });
			this.formArrayOut.clear({ emitEvent: false });
		}

		this.formGroup.patchValue(obj);
	}

	registerOnChange(fn: any): void {
		this.#onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.#onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.formGroup[isDisabled ? 'disable' : 'enable']();
	}

	onRemove(event: Event, item: any): void {
		event.preventDefault();

		item['removed'] = true;

		const {
			account: { accountId },
			source,
			instrument,
		} = this.controlFilter.value;

		if (this.#store.isOrder(item.orderTypeText)) {
			this.#store.removeBrokerOrder({
				accountId,
				instrumentId: instrument.id,
				orderId: item.orderId,
				sourceId: source.id,
			});
		}

		if (this.#store.isStopOrder(item.orderTypeText)) {
			this.#store.removeBrokerStopOrder({
				accountId,
				instrumentId: instrument.id,
				orderId: item.stopOrderId,
				sourceId: source.id,
			});
		}
	}

	onRemoveOrder(event: Event, item: TradeJournal & { removed: boolean }): void {
		event.preventDefault();

		this.#store.removeOrder(item);
	}

	onRemoveStopOrder(event: Event, item: TradeJournal & { removed: boolean }): void {
		event.preventDefault();

		this.#store.removeStopOrder(item);
	}

	onOpen(event: Event, control: FormArray, direction: boolean, type: 'out' | 'entry' | 'stop' = 'entry') {
		event.preventDefault();

		const { instrument, lastPrice } = this.controlFilter.value;
		const {
			idea: { positionType },
		} = this.controlPosition.value;
		const directionValue = direction ? positionType === StockPositionType.LONG : positionType !== StockPositionType.LONG;

		const minPriceIncrement = getNumberPrecision(
			instrument.minPriceIncrement * 3,
			getPriceIncrement(instrument.minPriceIncrement)
		);
		let max = null;

		if (type === 'out' && this.formArrayEntry.value && this.formArrayEntry.value.length > 0) {
			max = this.formArrayEntry.value.reduce((acc: number, item: { lots: number }) => {
				return acc + item.lots;
			}, 0);
		}

		this.#dialog
			.openTradeRequest(this.#injector, {
				data: {
					direction: { value: directionValue, disabled: true },
					orderType: { value: null, disabled: false },
					price: { value: null, disabled: false },
					lot: { value: instrument.lot, disabled: false },
					minPriceIncrement: { value: minPriceIncrement, disabled: false },
					quantity: { value: null, disabled: false },
					lastPrice: { value: lastPrice.last, disabled: true },
					max,
				},
			})
			.pipe(takeUntilDestroyed(this.#destroyRef))
			.subscribe((value: RequestFormValue | null) => {
				if (value) {
					const calcValue: Partial<ControlValue> = {
						...value,
						status: TradeJournalStatus.UNLOADING,
						commission: 0,
						change: false,
						removed: false,
						lot: instrument.lot,
						lots: Math.floor(value.quantity / instrument.lot),
						total: value.total,
					};
					control.setControl(control.controls.length, new FormControl(calcValue));
				}
			});
	}

	onEdit(event: Event, item: TradeJournal & { change: boolean }, index: number, control: FormArray): void {
		event.preventDefault();

		item['change'] = true;

		const { account, source, instrument, lastPrice } = this.controlFilter.value;
		const minPriceIncrement = getNumberPrecision(
			instrument.minPriceIncrement * 3,
			getPriceIncrement(instrument.minPriceIncrement)
		);

		this.#dialog
			.openTradeRequest(this.#injector, {
				data: {
					...this._getDataForRequestForm(item),
					lastPrice: { value: lastPrice.last, disabled: true },
					minPriceIncrement: { value: minPriceIncrement, disabled: false },
				},
			})
			.pipe(takeUntilDestroyed(this.#destroyRef))
			.subscribe((value: RequestFormValue | null) => {
				if (value) {
					const calcValue: Partial<TradeJournal & TradeJournalSystem> = {
						...item,
						externalId: null,
						id: 0,
						price: value.price,
						quantity: value.quantity,
						lots: value.lots,
						orderType: value.orderType.id,
						orderTypeText: value.orderType.type,
						stopPrice: value.stopPrice,
						status: null,
						change: false,
						total: value.total,
					};

					if (item.status === TradeJournalStatus.AWAITS && calcValue.orderType) {
						this.formArrayRemove.push(new FormControl(item));
					}
					control.setControl(index, new FormControl(calcValue));
				} else {
					control.at(index).patchValue({
						...item,
						change: false,
					});
				}
			});
	}

	onRemoveWithControl(event: Event, item: TradeJournal & { removed: boolean }, index: number, control: FormArray): void {
		event.preventDefault();

		item['removed'] = true;

		if (item.status === TradeJournalStatus.AWAITS) {
			if (item.orderType) {
				if (this.#store.isOrder(item.orderTypeText)) {
					this.onRemoveOrder(event, item);
				}

				if (this.#store.isStopOrder(item.orderTypeText)) {
					this.onRemoveStopOrder(event, item);
				}
			}

			control.at(index).disable();
			return;
		}

		if (item.externalId !== null) {
			this.#store.removeJournalItem(item);

			control.at(index).disable();
			return;
		}

		control.removeAt(index, { emitEvent: true });
	}

	onExpanded(event: Event): void {
		event.preventDefault();

		this.expanded.update((status: boolean) => !status);
	}

	onExpandedFilter(event: Event): void {
		event.preventDefault();

		this.expandedFilter.update((status: boolean) => !status);
	}

	addFromIdea(event: Event): void {
		this.addFromIdeaEntry(event);
		this.addFromIdeaOut(event);
		this.addFromIdeaStop(event);
	}

	addFromIdeaEntry(event: Event): void {
		event.preventDefault();

		const {
			filter: { account, source },
			position,
			idea,
		} = this.formGroup.value;

		const entriesUnloadingControlValue = this.#service.getUnloadingControlValue(
			account.accountId,
			source,
			position,
			idea.entry,
			TRADE_ORDER_TYPE_LIMIT
		);

		const startIndex = this.formArrayEntry.value.length;

		entriesUnloadingControlValue.forEach((item: TradeJournal, index: number) => {
			this.formArrayEntry.setControl(startIndex + index + length, new FormControl(item));
		});
	}

	addFromIdeaOut(event: Event): void {
		event.preventDefault();

		const {
			filter: { account, source },
			position,
			idea,
		} = this.formGroup.value;

		const targetsUnloadingControlValue = this.#service.getUnloadingControlValue(
			account.accountId,
			source,
			position,
			idea.out,
			TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
			'reverse'
		);

		const startIndex = this.formArrayOut.value.length;

		targetsUnloadingControlValue.forEach((item: TradeJournal, index: number) => {
			this.formArrayOut.setControl(startIndex + index + length, new FormControl(item));
		});
	}

	addFromIdeaStop(event: Event): void {
		event.preventDefault();

		const {
			filter: { account, source },
			position,
			idea,
		} = this.formGroup.value;

		const stopsUnloadingControlValue = this.#service.getUnloadingControlValue(
			account.accountId,
			source,
			position,
			idea.stop,
			TRADE_STOP_ORDER_TYPE_STOP_LOSS,
			'reverse'
		);

		const startIndexStop = this.formArrayStop.value.length;

		stopsUnloadingControlValue.forEach((item, index: number) => {
			this.formArrayStop.setControl(startIndexStop + index, new FormControl(item));
		});
	}

	private _getDataForRequestForm(item: TradeJournal) {
		return {
			direction: { value: item.direction, disabled: true },
			expirationType: { value: item.expirationType, disabled: false },
			expireDate: { value: item.expireDate, disabled: false },
			orderType: { value: { id: item.orderType, type: item.orderTypeText }, disabled: false },
			price: { value: item.price, disabled: false },
			lot: { value: item.lot, disabled: false },
			stopPrice: { value: item.stopPrice, disabled: false },
			trailingIndent: { value: item.trailingIndent || 1, disabled: false },
			trailingIndentType: { value: item.trailingIndentType || 1, disabled: false },
			trailingSpread: { value: item.trailingSpread || 1, disabled: false },
			trailingSpreadType: { value: item.trailingSpreadType || 1, disabled: false },
			quantity: { value: item.quantity, disabled: false },
		};
	}

	private _distinctJournal(previous: TradeJournal[], current: TradeJournal[]): boolean {
		if (previous.length !== current.length) {
			return false;
		}

		const sortPrevious = previous.sort((a: TradeJournal, b: TradeJournal) => a.id - b.id);
		const sortCurrent = previous.sort((a: TradeJournal, b: TradeJournal) => a.id - b.id);

		return sortPrevious.every((item: TradeJournal, index: number) => item.id === sortCurrent[index].id);
	}

	private _distinctOrders(a: TradeOrders, b: TradeOrders): boolean {
		if (a.length !== b.length) {
			return false;
		}

		return a.every((item: TradeOrder, index: number) => {
			return (
				item.lotsRequested === b[index].lotsRequested &&
				item.orderType === b[index].orderType &&
				item.averagePositionPrice.value === b[index].averagePositionPrice.value
			);
		});
	}

	private _distinctStopOrders(a: TradeStopOrders, b: TradeStopOrders): boolean {
		if (a.length !== b.length) {
			return false;
		}

		return a.every((item: TradeStopOrder, index: number) => {
			return (
				item.lotsRequested === b[index].lotsRequested &&
				item.orderType === b[index].orderType &&
				item.stopPrice.value === b[index].stopPrice.value
			);
		});
	}

	private _sortJournal(journal: TradeJournal[], direction: boolean): TradeJournal[] {
		const { executed, other } = journal.reduce(
			(acc: { executed: TradeJournal[]; other: TradeJournal[] }, item: TradeJournal) => {
				if (item.status === TradeJournalStatus.EXECUTED) {
					acc.executed.push(item);
				} else {
					acc.other.push(item);
				}
				return acc;
			},
			{ executed: [], other: [] }
		);

		return [
			...executed.sort((a: TradeJournal, b: TradeJournal) => (b.price - a.price) * -1 * +direction),
			...other.sort((a: TradeJournal, b: TradeJournal) => (b.price - a.price) * -1 * +direction),
		];
	}

	private _initControlsForIdea(
		position: StockPosition,
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operations: TradeOperations,
		portfolio: TradePortfolio,
		idea: DefaultIdea
	) {
		const direction = position.idea.positionType === StockPositionType.LONG;
		const actualOperations = this.#service.getActualOperations(position, operations);
		const operationTypeEntry = this.#service.getOperationType(direction);
		const operationTypeOut = this.#service.getOperationType(!direction);
		const {
			account: { accountId },
			source,
			lastPrice,
		} = this.controlFilter.value;

		const entriesUnloadingControlValue = this.#service
			.getUnloadingControlValue(accountId, source, position, idea.entry, TRADE_ORDER_TYPE_LIMIT)
			.map((item: TradeJournal) => {
				if (item.direction && item.price >= lastPrice.last * 0.995) {
					item.orderType = TRADE_ORDER_TYPE_MARKET.id;
					item.orderTypeText = TRADE_ORDER_TYPE_MARKET.type;
				}

				if (!item.direction && item.price <= lastPrice.last * 1.005) {
					item.orderType = TRADE_ORDER_TYPE_MARKET.id;
					item.orderTypeText = TRADE_ORDER_TYPE_MARKET.type;
				}

				return item;
			});

		const entriesActualOperations = actualOperations.filter((item) => item.type === operationTypeEntry);

		const entriesExecutedControlValue =
			accumFn(position.actions.entries, 'amount') === (portfolio.positions[0] && portfolio.positions[0].quantity)
				? this.#service.getExecutedControlValue(
						accountId,
						source,
						position,
						position.actions.entries,
						entriesActualOperations
				  )
				: this.#service.getPositionControlValue(
						accountId,
						source,
						position,
						portfolio.positions[0],
						entriesActualOperations
				  );

		const entriesAwaitsControlValue = this.#service.getAwaitsControlValue(
			accountId,
			source,
			position,
			orders,
			stopOrders
		);

		const targetsUnloadingControlValue = this.#service.getUnloadingControlValue(
			accountId,
			source,
			position,
			idea.out,
			TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
			'reverse'
		);

		const targetsExecutedControlValue = this.#service.getExecutedControlValue(
			accountId,
			source,
			position,
			position.actions.outs,
			actualOperations.filter((item) => item.type === operationTypeOut),
			'reverse'
		);

		const targetsAwaitsControlValue = this.#service.getAwaitsControlValue(
			accountId,
			source,
			position,
			orders,
			stopOrders,
			'reverse'
		);

		const stopsUnloadingControlValue = this.#service.getUnloadingControlValue(
			accountId,
			source,
			position,
			idea.stop,
			TRADE_STOP_ORDER_TYPE_STOP_LOSS,
			'reverse'
		);

		const entry = [...entriesUnloadingControlValue, ...entriesExecutedControlValue, ...entriesAwaitsControlValue];
		const out = [...targetsUnloadingControlValue, ...targetsExecutedControlValue, ...targetsAwaitsControlValue];

		const re = this.#service.getEntryPositionFromJournal(accountId, source, position, entry, out, portfolio);

		return {
			entry,
			out,
			stop: stopsUnloadingControlValue,
		};
	}

	private _initControlsForJournal(
		position: StockPosition,
		journal: TradeJournal[],
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operations: TradeOperations
	) {
		const journalUpdate = this._updateTradeJournalOrder(position, journal, orders, stopOrders, operations);

		const entry = this.#service.getEntryFromJournal(position, journalUpdate);
		const out = this.#service.getOutFromJournal(position, journalUpdate);
		const stop = this.#service.getStopFromJournal(position, journalUpdate);

		return {
			entry,
			out,
			stop,
		};
	}

	private _updateTradeJournalOrder(
		position: StockPosition,
		journal: TradeJournal[],
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operations: TradeOperations
	): TradeJournal[] {
		const listForUpdate: TradeJournal[] = [];
		const date = journal[0] && journal[0].ideaDate ? new Date(journal[0].ideaDate).valueOf() : null;
		const operationList = operations.filter((item: TradeOperation) => {
			if (date) {
				return item.state === 1 && date <= new Date(item.date).valueOf();
			}
			return item.state === 1;
		});

		const list = journal.map((item: TradeJournal) => {
			const findOrder: TradeOrder | null =
				orders.find((order: TradeOrder) => order.orderRequestId === item.externalId) || null;

			if (item.status === TradeJournalStatus.UNLOADING && findOrder) {
				listForUpdate.push({
					...item,
					price: findOrder.averagePositionPrice.value,
					status: TradeJournalStatus.AWAITS,
				});
				return item;
			}

			if (findOrder) {
				item.orderId = findOrder.orderId;
				return item;
			}

			const findStopOrder =
				stopOrders.find(
					(order: TradeStopOrder) =>
						order.lotsRequested === item.lots &&
						+order.direction === +item.direction &&
						order.price.value === item.price &&
						order.stopPrice.value === item.stopPrice
				) || null;

			if (item.status === TradeJournalStatus.UNLOADING && findStopOrder) {
				listForUpdate.push({
					...item,
					price: findStopOrder.price.value,
					stopPrice: findStopOrder.stopPrice.value,
					status: TradeJournalStatus.AWAITS,
				});
				return item;
			}

			if (findStopOrder) {
				item.orderId = findStopOrder.stopOrderId;
				return item;
			}

			const operationType = this.#service.getOperationType(item.direction);

			if (item.status === TradeJournalStatus.EXECUTED) {
				const findIndex: number = operationList.findIndex(
					(operation: TradeOperation) =>
						operation.quantity === item.quantity && operation.type === operationType && operation.state === 1
				);

				if (findIndex !== -1) {
					operationList.splice(findIndex, 1);
				}

				return item;
			}

			if (item.status === TradeJournalStatus.AWAITS) {
				const findOperation: TradeOperation | null =
					operationList.find(
						(operation: TradeOperation) =>
							operation.quantity === item.quantity && operation.type === operationType && operation.state === 1
					) || null;

				if (findOperation) {
					listForUpdate.push({
						...item,
						price: findOperation.price.value,
						total: getNumberPrecision(findOperation.price.value * item.quantity, 2),
						expireDate: findOperation.date,
						commission: Math.abs(findOperation.comission.value),
						status: TradeJournalStatus.EXECUTED,
					});
					return item;
				}

				if (findOrder) {
					return item;
				}

				if (findStopOrder) {
					console.log(findStopOrder);
					return item;
				}

				return {
					...item,
					status: TradeJournalStatus.BROKEN,
				};
			}

			return item;
		});

		if (listForUpdate.length > 0) {
			this.#store.setJournalItems(listForUpdate);

			const listExecuted = listForUpdate.filter((item: TradeJournal) => item.status === TradeJournalStatus.EXECUTED);

			if (listExecuted.length > 0) {
				this.#idea.editIdea({
					id: position.idea.id as number,
					body: this.#service.updateIdeaFromJournal(position, listExecuted),
				});
			}
		}

		return list;
	}

	private _getQuantityForJournal(journal: TradeJournal[] | null): number {
		if (journal === null) {
			return 0;
		}

		return journal.reduce((acc: number, item: TradeJournal) => {
			if (item.status === TradeJournalStatus.EXECUTED && item.externalId !== null && item.trailingIndentType !== 0) {
				acc += item.quantity;
			}

			return acc;
		}, 0);
	}

	private _updateIdeaActions(position: StockPosition, operations: TradeOperations): boolean {
		const direction = position.idea.positionType === StockPositionType.LONG;
		const lot = position.idea.instrument.lot;
		const { source } = this.controlFilter.value;

		const operationTypeEntry = this.#service.getOperationType(direction);
		const operationTypeOut = this.#service.getOperationType(!direction);
		const actualOperations = this.#service.getActualOperations(position, operations);

		const operationsEntryPosition = this.#service.getFilteredOperations(
			position.actions.entries
				.filter((item: StockPositionActionEntry) => item.brokerId === source.id)
				.map((item: StockPositionActionEntry) => ({
					lots: Math.floor(item.amount / lot),
					date: item.date,
				})),
			actualOperations,
			operationTypeEntry
		);

		const operationsOutPosition = this.#service.getFilteredOperations(
			position.actions.outs
				.filter((item: StockPositionActionTarget) => item.brokerId === source.id)
				.map((item: StockPositionActionTarget) => ({
					lots: Math.floor(item.amount / lot),
					date: item.date,
				})),
			actualOperations,
			operationTypeOut
		);

		const operationsCommissions = [...operationsEntryPosition, ...operationsOutPosition]
			.filter((item) => item.comission.value !== 0)
			.filter((item) => {
				return (
					position.comissions.findIndex(
						(commission) => commission.date === item.date && Math.abs(commission.size) === Math.abs(item.comission.value)
					) === -1
				);
			});

		if (operationsEntryPosition.length > 0 || operationsOutPosition.length > 0 || operationsCommissions.length > 0) {
			const id = position.idea.id;
			if (id) {
				this.#idea.editIdea({
					id,
					body: this.#service.updateIdea(position, operationsEntryPosition, operationsOutPosition, operationsCommissions),
				});
			}

			return true;
		}

		return false;
	}

	private _getStartIdeaWithLimit(position: StockPosition, limit: number | null): DefaultIdea {
		if (position.idea.author === 'bot') {
			const entries = calculateEntries(
				position.idea.entries,
				position.idea.instrument.lot,
				position.idea.minPriceIncrement,
				limit
			);

			return {
				entry: entries,
				out: calculateTargets(
					position.idea.positionType as 'long' | 'short',
					position.idea.targets,
					entries,
					position.idea.instrument.lot,
					position.idea.minPriceIncrement
				),
				stop: calculateStop(
					position.idea.positionType as 'long' | 'short',
					position.idea.stop ? [position.idea.stop] : [],
					entries,
					position.idea.instrument.lot,
					position.idea.instrument.minPriceIncrement
				),
			};
		}

		const entries = transformEntries(position.idea.entries, position.idea.instrument.lot);

		return {
			entry: transformEntries(position.idea.entries, position.idea.instrument.lot),
			out: transformTargets(position.idea.targets, position.idea.instrument.lot),
			stop: calculateStop(
				position.idea.positionType as 'long' | 'short',
				position.idea.stop ? [position.idea.stop] : [],
				entries,
				position.idea.instrument.lot,
				position.idea.instrument.minPriceIncrement
			),
		};
	}

	private _updateFormArray(formArray: FormArray, journal: TradeJournal[]): void {
		const removeIds: number[] = this.formArrayRemove.controls.map((control) => control.value.id);
		const addedIds: number[] = [];

		if (formArray.controls.length === 0) {
			journal.forEach((item: TradeJournal) => {
				formArray.push(new FormControl(item), { emitEvent: false });
			});

			formArray.patchValue([], { emitEvent: true });

			return;
		}

		formArray.controls.forEach((control: AbstractControl) => {
			const id: number = control.value.id;

			if (id === 0) {
				return;
			}

			const find: TradeJournal | null = journal.find((item: TradeJournal) => item.id === id) || null;

			if (find !== null) {
				addedIds.push(find.id);
				control.patchValue(find, { emitEvent: false });
			}
		});

		const concatIds = [...removeIds, ...addedIds];

		journal.forEach((item: TradeJournal) => {
			if (concatIds.findIndex((id) => id === item.id) === -1 && item.id !== 0) {
				formArray.push(new FormControl(item), { emitEvent: false });
			}
		});

		formArray.patchValue([], { emitEvent: true });
	}
}
