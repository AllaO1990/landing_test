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
	of,
	pairwise,
	shareReplay,
	startWith,
	switchMap,
	takeWhile,
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
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
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
import { TradeJournal, TradeJournalOpenPosition, TradeJournalStatus, TradeJournalSystem } from 'types/trade';
import { StockPositionType } from 'types/stock-position-type';
import { getPriceIncrement } from 'utils/get-price-increment';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';

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
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
	readonly #timerInterval: number = inject(TIMER_INTERVAL);
	readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

	readonly #reload = toObservable(this.#store.reload);

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
		lastIdea: new FormControl<DefaultIdea | null>(null),
		position: new FormControl<StockPosition | null>(null),
		idea: new FormControl<DefaultIdea | null>(null),
		filter: new FormControl(null),
		auto: new FormControl(true, { nonNullable: true }),
		isNew: new FormControl(true),
		journal: new FormGroup({
			entry: new FormArray([]),
			out: new FormArray([]),
			stop: new FormArray([]),
			remove: new FormArray([]),
		}),
	});

	get controlGroupJournal(): FormGroup {
		return this.formGroup.get('journal') as FormGroup;
	}

	get controlLastIdea(): FormControl {
		return this.formGroup.get('lastIdea') as FormControl;
	}

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
		return this.controlGroupJournal.get('remove') as FormArray;
	}

	get formArrayEntry(): FormArray {
		return this.controlGroupJournal.get('entry') as FormArray;
	}

	get formArrayOut(): FormArray {
		return this.controlGroupJournal.get('out') as FormArray;
	}

	get formArrayStop(): FormArray {
		return this.controlGroupJournal.get('stop') as FormArray;
	}

	get controlFilter(): FormControl {
		return this.formGroup.get('filter') as FormControl;
	}

	filter$: Observable<Params> = this.controlFilter.valueChanges.pipe(
		takeUntilDestroyed(this.#destroyRef),
		filter((value) => value !== null),
		map((value: { source: TradeSource; account: TradeAccount; instrument: StockInstrument }) => ({
			sourceId: value.source && value.source.id,
			accountId: value.account && value.account.accountId,
			instrumentId: value.instrument && value.instrument.id,
		})),
		filter((value) => value.accountId !== null && value.instrumentId !== null && value.sourceId !== null),
		distinctUntilChanged((a, b) => this._distinct(a, b)),
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

	readonly idea$: Observable<StockPosition | null> = this.#idea.idea$.pipe(debounceTime(300));
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
	readonly journal$: Observable<TradeJournal[] | null> = this.#store.journal$.pipe(
		filter((journal: TradeJournal[] | null | undefined): journal is TradeJournal[] | null => journal !== undefined)
	);

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

	readonly #statusCurrentTrade$: Observable<boolean | null> = this.idea$.pipe(
		takeUntilDestroyed(this.#destroyRef),
		map((position: StockPosition | null) => position && position.idea.id),
		filter((id: number | null) => id !== null),
		distinctUntilChanged(),
		switchMap((positionIdeaId: number) =>
			this.filter$.pipe(
				debounceTime(300),
				switchMap((filter: Params) =>
					this.#api.getJournalOpenPositions(filter).pipe(
						map((response: Response<TradeJournalOpenPosition[]>) => response.data && response.data[0]),
						map((openPosition: TradeJournalOpenPosition | null) => {
							if (openPosition === null || openPosition.netQuantity === 0) {
								return true;
							}

							return positionIdeaId === openPosition.ideaId;
						})
					)
				)
			)
		),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	readonly journalIdeaId$: Observable<number | null> = this.journal$.pipe(
		map((journal: TradeJournal[] | null) => journal && journal[0].ideaId),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	readonly isCurrentTrade = toSignal(this.#statusCurrentTrade$, { initialValue: null });

	readonly positionAndDefaultIdea$: Observable<DefaultIdea & { position: StockPosition }> = this.idea$.pipe(
		filter((position: StockPosition | null) => position !== null),
		switchMap((position: StockPosition) =>
			of(position.idea.instrument.currencyId).pipe(
				distinctUntilChanged(),
				switchMap((currency: number) => this.#api.getLimitForCurrency(currency)),
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
		combineLatest([
			this.filter$.pipe(
				tap(() => {
					this.formArrayEntry.clear();
					this.formArrayOut.clear();
					this.formArrayStop.clear();
				})
			),
			this.idea$.pipe(
				filter((position: StockPosition | null) => position !== null),
				distinctUntilChanged((a, b) => a.idea.id === b.idea.id)
			),
			this.#reload,
		])
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				debounceTime(500),
				switchMap(([params, position]: [Params, StockPosition, void]) =>
					timer(0, this.#timerInterval).pipe(
						takeUntilDestroyed(this.#destroyRef),
						map(() => ({
							...params,
							status: 1,
							from: position.idea.createdAt,
							to: new Date().toISOString(),
						}))
					)
				)
			)
			.subscribe((params: Params) => {
				this.#store.loadJournal(params);
				this.#store.loadOrders(params);
				this.#store.loadOperations(params);
			});

		this.controlIsNew.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlIsNew.value),
				filter((status: boolean) => !status),
				switchMap(() => this.#statusCurrentTrade$.pipe(takeWhile((status: boolean | null) => status === true))),
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
				console.log('formArrayEntry addOrders', list);

				this.#store.addOrders(list);
			});

		this.positionAndDefaultIdea$
			.pipe(
				tap(({ position, ...idea }: DefaultIdea & { position: StockPosition }) => {
					this.controlIdea.setValue(idea);
					this.controlPosition.setValue(position);
				}),
				switchMap((data: DefaultIdea & { position: StockPosition }) =>
					this.#statusCurrentTrade$.pipe(
						filter((status: boolean | null) => status === true),
						map(() => data)
					)
				),
				switchMap(({ position, ...idea }: DefaultIdea & { position: StockPosition }) =>
					combineLatest([
						this.orders$.pipe(
							filter((orders: TradeOrders | null): orders is TradeOrders => orders !== null),
							distinctUntilChanged((a: TradeOrders, b: TradeOrders) => this._distinctOrders(a, b))
						),
						this.stopOrders$.pipe(
							filter((orders: TradeStopOrders | null): orders is TradeStopOrders => orders !== null),
							map((orders: TradeStopOrders) => orders.filter((order: TradeStopOrder) => order.status <= 2))
						),
						this.operations$.pipe(
							filter((operations: TradeOperations | null): operations is TradeOperations => operations !== null),
							distinctUntilChanged((a: TradeOperations, b: TradeOperations) => a.length === b.length)
						),
						this.portfolio$.pipe(
							filter((portfolio: TradePortfolio | null): portfolio is TradePortfolio => portfolio !== null)
						),
						this.journal$.pipe(
							map((journal: TradeJournal[] | null) => {
								if (journal) {
									const list = journal.filter((item) => item.ideaId === position.idea.id);

									return list.length > 0 ? list : null;
								}

								return null;
							})
						),
					]).pipe(
						takeUntilDestroyed(this.#destroyRef),
						debounceTime(1000),
						map(
							([orders, stopOrders, operations, portfolio, journal]: [
								TradeOrders,
								TradeStopOrders,
								TradeOperations,
								TradePortfolio,
								TradeJournal[] | null
							]) => {
								let common: { entry: TradeJournal[]; out: TradeJournal[]; stop: TradeJournal[] } | null = null;

								if (journal === null) {
									this.formArrayEntry.clear();
									this.formArrayOut.clear();
									this.formArrayStop.clear();

									common = this._initControlsForIdea(position, orders, stopOrders, operations, portfolio, idea);
								} else {
									common = this._initControlsForJournal(position, journal, orders, stopOrders, operations);

									const isEqualPosition = this._equalPosition(position, common);

									if (isEqualPosition) {
										return null;
									}

									this.controlIsNew.setValue(false);
								}

								if (common === null) {
									return null;
								}

								return {
									...common,
									position,
								};
							}
						)
					)
				),
				filter(
					(value: { entry: TradeJournal[]; out: TradeJournal[]; stop: TradeJournal[]; position: StockPosition } | null) =>
						value !== null
				),
				finalize(() => console.log('finalize subscribe'))
			)
			.subscribe((res: { entry: TradeJournal[]; out: TradeJournal[]; stop: TradeJournal[]; position: StockPosition }) => {
				const direction = res.position.idea.positionType === StockPositionType.LONG;

				this._updateFormArray(this.formArrayEntry, this._sortJournal(res.entry, direction));
				this._updateFormArray(this.formArrayOut, this._sortJournal(res.out, direction));
				this._updateFormArray(this.formArrayStop, this._sortJournal(res.stop, direction));

				this.#store.updateIsLoading(false);
				// this.formGroupArray.markAsPristine();
			});

		this.controlIsNew.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlIsNew.value),
				filter((status: boolean) => !status),
				switchMap(() => this.#statusCurrentTrade$.pipe(takeWhile((status: boolean | null) => status === true))),
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
				console.log('formArrayOut addOrders', list);

				this.#store.addOrders(list);
			});

		this.controlIsNew.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlIsNew.value),
				filter((status: boolean) => !status),
				switchMap(() => this.#statusCurrentTrade$.pipe(takeWhile((status: boolean | null) => status === true))),
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
					this.formArrayOut.valueChanges.pipe(
						takeUntilDestroyed(this.#destroyRef),
						map((list: TradeJournal[] | null) => {
							if (list === null) {
								return false;
							}

							return list.every(
								(item: TradeJournal) => item.status !== null && item.externalId !== null && item.trailingIndentType !== 0
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

				this.#store.addOrders(list);
			});

		this.controlIsNew.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlIsNew.value),
				filter((status: boolean) => !status),
				switchMap(() => this.#statusCurrentTrade$.pipe(takeWhile((status: boolean | null) => status === true))),
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
				console.log('formArrayStop Change', quantity, new Date().toISOString());

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
			.pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.formGroup.value), debounceTime(300))
			.subscribe((value) => {
				this.#onChange(value);
			});
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
			this.formArrayRemove.clear({ emitEvent: true });
			// this.formArrayEntry.clear({ emitEvent: true });
			// this.formArrayOut.clear({ emitEvent: true });
		} else {
			this.formGroup.patchValue(obj);
		}

		this.formGroup.markAsPristine();
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

	switchToIdea(event: Event, id: number): void {
		event.stopPropagation();

		this.controlLastIdea.setValue(null);
		this.#queryParams.update({ id });
	}

	switchToIdeaWithJournal(event: Event, id: number): void {
		event.stopPropagation();

		this.controlLastIdea.setValue(this.controlIdea.value);
		this.#queryParams.update({ id });
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
				orderId: item.externalId,
				sourceId: source.id,
			});
		}

		if (this.#store.isStopOrder(item.orderTypeText)) {
			this.#store.removeBrokerStopOrder({
				accountId,
				instrumentId: instrument.id,
				orderId: item.externalId,
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

		const {
			instrument,
			lastPrice,
			account: { accountId },
			source,
		} = this.controlFilter.value;
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
					const calcValue: Partial<TradeJournal & TradeJournalSystem> = {
						...value,
						status: null,
						commission: 0,
						change: false,
						remove: false,
						accountId,
						sourceId: source.id,
						instrumentId: instrument.id,
						lot: instrument.lot,
						lots: Math.floor(value.quantity / instrument.lot),
						total: value.total,
						orderType: value.orderType.id,
						orderTypeText: value.orderType.type,
					};
					control.setControl(control.controls.length, new FormControl(calcValue));

					console.log(control);
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
				control.markAsDirty();

				if (value) {
					const calcValue: Partial<TradeJournal & TradeJournalSystem> = {
						...item,
						externalId: null,
						id: 0,
						price: value.price,
						quantity: value.quantity,
						lots: value.lots,
						trailingSpread: value.trailingSpread,
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

		control.markAsDirty();

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
		const actualOperations = this.#service.getActualOperations(position, operations, []);
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

		const entriesExecutedControlValue = this.#service.getExecutedControlValue(
			accountId,
			source,
			position,
			position.actions.entries,
			entriesActualOperations
		);
		// accumFn(position.actions.entries, 'amount') === (portfolio.positions[0] && portfolio.positions[0].quantity)
		// 	?
		// 	: this.#service.getPositionControlValue(
		// 			accountId,
		// 			source,
		// 			position,
		// 			portfolio.positions[0],
		// 			entriesActualOperations
		// 	  );

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

		/**
     Можно получить TradeJournal из позиции портфела, если до выставления заявок уже были активы
     const re = this.#service.getEntryPositionFromJournal(accountId, source, position, entry, out, portfolio);
    */

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
	): { entry: TradeJournal[]; out: TradeJournal[]; stop: TradeJournal[] } | null {
		const journalUpdate: TradeJournal[] | null = this._updateTradeJournalOrder(
			position,
			journal,
			orders,
			stopOrders,
			operations
		);

		if (journalUpdate === null) {
			return null;
		}

		let entry: TradeJournal[] = this.#service.getEntryFromJournal(position, journalUpdate);
		let out: TradeJournal[] = this.#service.getOutFromJournal(position, journalUpdate);
		let stop: TradeJournal[] = this.#service.getStopFromJournal(position, journalUpdate);

		const controlValue: DefaultIdea | null = this.controlLastIdea.value;

		if (controlValue) {
			const {
				filter: { account, source },
				position,
			} = this.formGroup.value;

			const entriesUnloadingControlValue = this.#service.getUnloadingControlValue(
				account.accountId,
				source,
				position,
				controlValue.entry,
				TRADE_ORDER_TYPE_LIMIT
			);

			const targetsUnloadingControlValue = this.#service.getUnloadingControlValue(
				account.accountId,
				source,
				position,
				controlValue.out,
				TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
				'reverse'
			);

			const stopsUnloadingControlValue = this.#service.getUnloadingControlValue(
				account.accountId,
				source,
				position,
				controlValue.stop,
				TRADE_STOP_ORDER_TYPE_STOP_LOSS,
				'reverse'
			);

			entry = [...entry, ...entriesUnloadingControlValue];
			out = [...out, ...targetsUnloadingControlValue];
			stop = [...stop, ...stopsUnloadingControlValue];
		}

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
	): TradeJournal[] | null {
		const listForUpdate: TradeJournal[] = [];
		const copyOrders: TradeOrders = orders.slice();
		const copyStopOrders: TradeStopOrders = stopOrders.slice();
		const copyOperations = this.#service.getActualOperations(
			position,
			operations.filter((item: TradeOperation) => item.state === 1 && (item.type === 15 || item.type === 22)),
			journal
		);

		const list = journal
			.filter((item) => item.ideaId === position.idea.id)
			.map((item: TradeJournal) => {
				const findIndexOrder: number = copyOrders.findIndex(
					(order: TradeOrder) => order.orderRequestId === item.externalId || order.orderId === item.orderId
				);

				if (item.status === TradeJournalStatus.UNLOADING && findIndexOrder !== -1) {
					listForUpdate.push({
						...item,
						orderId: copyOrders[findIndexOrder].orderId,
						price: copyOrders[findIndexOrder].averagePositionPrice.value,
						ideaDate: item.ideaDate ? item.ideaDate : copyOrders[findIndexOrder].orderDate || new Date().toISOString(),
						status: TradeJournalStatus.AWAITS,
					});

					copyOrders.splice(findIndexOrder, 1);

					return item;
				}

				if (findIndexOrder !== -1 && copyOrders[findIndexOrder]) {
					item.orderId = copyOrders[findIndexOrder].orderId;
					copyOrders.splice(findIndexOrder, 1);

					return item;
				}

				let findIndexStopOrder: number = copyStopOrders.findIndex(
					(order: TradeStopOrder) => order.stopOrderId === item.externalId || order.stopOrderId === item.orderId
				);

				if (findIndexStopOrder === -1 && copyStopOrders.length > 0) {
					findIndexStopOrder = copyStopOrders.findIndex(
						(order: TradeStopOrder) =>
							order.lotsRequested === item.lots &&
							+order.direction === +item.direction &&
							order.price.value === item.price &&
							order.stopPrice.value === item.stopPrice
					);
				}

				if (item.status === TradeJournalStatus.UNLOADING && findIndexStopOrder !== -1) {
					listForUpdate.push({
						...item,
						orderId: copyStopOrders[findIndexStopOrder].stopOrderId,
						price: copyStopOrders[findIndexStopOrder].price.value,
						stopPrice: copyStopOrders[findIndexStopOrder].stopPrice.value,
						status: TradeJournalStatus.AWAITS,
					});

					copyStopOrders.splice(findIndexStopOrder, 1);

					return item;
				}

				if (findIndexStopOrder !== -1) {
					item.orderId = copyStopOrders[findIndexStopOrder].stopOrderId;
					copyStopOrders.splice(findIndexStopOrder, 1);

					return item;
				}

				const operationType = this.#service.getOperationType(item.direction);

				if (item.status === TradeJournalStatus.EXECUTED) {
					const findIndex: number = copyOperations.findIndex(
						(operation: TradeOperation) => operation.quantity === item.quantity && operation.type === operationType
					);

					if (findIndex !== -1) {
						const commission = Math.abs(copyOperations[findIndex].comission.value);

						if (item.commission === 0 && commission !== 0) {
							listForUpdate.push({
								...item,
								commission: commission,
							});
						}

						copyOperations.splice(findIndex, 1);

						return item;
					}

					return item;
				}

				if (item.status === TradeJournalStatus.AWAITS) {
					const findIndex: number = copyOperations.findIndex(
						(operation: TradeOperation) => operation.quantity === item.quantity && operation.type === operationType
					);

					if (findIndex !== -1) {
						const operation = copyOperations[findIndex];

						const journal = {
							...item,
							price: operation.price.value,
							total: getNumberPrecision(operation.price.value * item.quantity, 2),
							expireDate: operation.date,
							commission: Math.abs(operation.comission.value),
							status: TradeJournalStatus.EXECUTED,
						};

						listForUpdate.push(journal);
						copyOperations.splice(findIndex, 1);

						return journal;
					}

					if (findIndexOrder !== -1) {
						return item;
					}

					if (findIndexStopOrder !== -1) {
						return item;
					}

					return {
						...item,
						status: TradeJournalStatus.BROKEN,
					};
				}

				return item;
			});

		if (copyOrders.length !== 0) {
			const {
				account: { accountId },
				source,
			} = this.controlFilter.value;

			this.#service.getOrdersControlValue(accountId, source, position, copyOrders).forEach((item: TradeJournal) => {
				listForUpdate.push(item);
			});
		}

		if (copyStopOrders.length !== 0) {
			const {
				account: { accountId },
				source,
			} = this.controlFilter.value;

			this.#service
				.getStopOrdersControlValue(accountId, source, position, copyStopOrders)
				.forEach((item: TradeJournal) => {
					listForUpdate.push(item);
				});
		}

		if (copyOperations.length !== 0) {
			const {
				account: { accountId },
				source,
			} = this.controlFilter.value;

			this.#service
				.getOperationsControlValue(accountId, source, position, copyOperations)
				.forEach((item: TradeJournal) => {
					listForUpdate.push(item);
				});
		}

		if (listForUpdate.length > 0) {
			this.#store.setJournalItems(listForUpdate);

			const listExecuted = [...journal, ...listForUpdate].filter(
				(item: TradeJournal) => item.status === TradeJournalStatus.EXECUTED
			);

			if (listExecuted.length > 0) {
				this.#idea.editIdea({
					id: position.idea.id as number,
					body: this.#service.updateIdeaFromJournal(position, listExecuted),
				});
			}

			return null;
		}

		return list;
	}

	// private _initControlsFromOperation(
	// 	position: StockPosition,
	// 	journal: { entry: TradeJournal[]; out: TradeJournal[]; stop: TradeJournal[] },
	// 	operations: TradeOperations
	// ): boolean {
	// 	const date = new Date(position.idea.createdAt as string).valueOf();
	// 	const copyOperations = operations.filter(
	// 		(item: TradeOperation) =>
	// 			item.state === 1 && (item.type === 15 || item.type === 22) && new Date(item.date).valueOf() > date
	// 	);
	//
	// 	console.log(copyOperations);
	//
	// 	if (copyOperations.length === 0) {
	// 		return false;
	// 	}
	//
	// 	[...journal.entry, ...journal.out, ...journal.stop].forEach((item: TradeJournal) => {
	// 		if (item.status === TradeJournalStatus.EXECUTED) {
	// 			const operationType = this.#service.getOperationType(item.direction);
	//
	// 			const findIndex = copyOperations.findIndex((operation: TradeOperation) => {
	// 				return operation.quantity === item.quantity && operation.type === operationType;
	// 			});
	//
	// 			if (findIndex !== -1) {
	// 				copyOperations.splice(findIndex, 1);
	// 			}
	// 		}
	// 	});
	//
	// 	if (copyOperations.length > 0) {
	// 		const defaultItem = this.#service.getDefaultControlValue(position);
	// 		const {
	// 			account: { accountId },
	// 			source,
	// 		} = this.controlFilter.value;
	//
	// 		this.#store.setJournalItems(
	// 			copyOperations.map((item: TradeOperation) => ({
	// 				...defaultItem,
	// 				accountId,
	// 				sourceId: source.id,
	// 				id: 0,
	// 				price: item.price.value,
	// 				commission: Math.abs(item.comission.value),
	// 				total: getNumberPrecision(item.price.value * item.quantity, 2),
	// 				lots: item.quantity / defaultItem.lot,
	// 				quantity: item.quantity,
	// 				direction: this.#service.getDirectionFromOperation(item.type),
	// 				orderType: TRADE_ORDER_TYPE_LIMIT.id,
	// 				orderTypeText: TRADE_ORDER_TYPE_LIMIT.type,
	// 				status: TradeJournalStatus.EXECUTED,
	// 			}))
	// 		);
	//
	// 		return true;
	// 	}
	//
	// 	return false;
	// }

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
		if (journal.length === 0) {
			if (formArray.controls.length !== 0) {
				formArray.controls.forEach((item: AbstractControl<TradeJournal>, index: number) => {
					if (item.value.status !== null) {
						formArray.removeAt(index, { emitEvent: false });
					}
				});

				formArray.patchValue([], { emitEvent: true });
				formArray.enable();
			}

			return;
		}

		if (formArray.controls.length === 0) {
			journal.forEach((item: TradeJournal) => {
				formArray.push(new FormControl(item), { emitEvent: false });
			});

			formArray.patchValue([], { emitEvent: true });

			return;
		}

		const removeIds: number[] = this.formArrayRemove.controls.map(
			(control: AbstractControl<TradeJournal>) => control.value.id
		);
		const journalList = journal.slice();
		const removeIndex: number[] = [];
		const changeIds: number[] = [];

		formArray.controls.forEach((control: AbstractControl<TradeJournal>, index: number) => {
			const value: TradeJournal = control.value;

			if (value.id === 0) {
				const findIndex = journalList.findIndex((item: TradeJournal) => {
					return (
						item.direction === value.direction &&
						item.orderType === value.orderType &&
						item.price === value.price &&
						item.quantity === value.quantity
					);
				});

				if (findIndex !== -1) {
					const item = journalList[findIndex];
					changeIds.push(item.id);
					control.setValue(item, { emitEvent: false });
					journalList.splice(findIndex, 1);
				}

				return;
			}

			const findIndex = journalList.findIndex((item: TradeJournal) => item.id === value.id);

			if (findIndex !== -1) {
				const item = journalList[findIndex];
				changeIds.push(item.id);
				control.setValue(item, { emitEvent: false });
				journalList.splice(findIndex, 1);

				return;
			}

			removeIndex.push(index);
		});

		removeIndex.forEach((item: number) => {
			formArray.removeAt(item);
		});

		const concatIds = [...removeIds, ...changeIds];

		journalList.forEach((item: TradeJournal) => {
			const findIndex = concatIds.findIndex((id) => id === item.id);

			if (findIndex === -1 && item.id !== 0) {
				formArray.push(new FormControl(item), { emitEvent: false });
			}
		});

		formArray.patchValue([], { emitEvent: true });
		formArray.markAsPristine();
	}

	private _equalPosition(
		position: StockPosition,
		journal: { entry: TradeJournal[]; out: TradeJournal[]; stop: TradeJournal[] } | null
	): boolean {
		if (!position) {
			return false;
		}

		if (!journal) {
			return false;
		}

		const isEntry = journal.entry
			.filter((entry: TradeJournal) => entry.status === TradeJournalStatus.EXECUTED)
			.every((entry: TradeJournal) => {
				return (
					position.actions.entries.findIndex((item: StockPositionActionEntry) => {
						return entry.quantity === item.amount && entry.price === item.price;
					}) !== -1
				);
			});

		const isOut = journal.out
			.filter((out: TradeJournal) => out.status === TradeJournalStatus.EXECUTED)
			.every((out: TradeJournal) => {
				return (
					position.actions.outs.findIndex((item: StockPositionActionTarget) => {
						return out.quantity === item.amount && out.price === out.price;
					}) !== -1
				);
			});

		const isEdit = !isEntry || !isOut;

		if (isEdit) {
			this.#idea.editIdea({
				id: position.idea.id as number,
				body: this.#service.updateIdeaFromJournal(
					position,
					[...journal.entry, ...journal.out, ...journal.stop].filter(
						(item: TradeJournal) => item.status === TradeJournalStatus.EXECUTED
					)
				),
			});
		}

		return isEdit;
	}
}
