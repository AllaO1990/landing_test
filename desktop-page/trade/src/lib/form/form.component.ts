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
	BehaviorSubject,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	Observable,
	of,
	pairwise,
	shareReplay,
	skip,
	startWith,
	Subject,
	switchMap,
	take,
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
	TradeOrderType,
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
import { ControlValue, ControlValueStatus } from './form.types';
import { DetailsComponent } from '../details/details.component';
import { Params } from '@angular/router';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { DataAccess, Response } from 'types/response';
import { TradeFormDialogService } from './form.dialog.service';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { TIMER_INTERVAL } from 'tokens/desktop/timer-interval';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { calculateEntries, calculateStop, calculateTargets } from 'utils/idea-calculate';
import {
	TRADE_ORDER_TYPE_LIMIT,
	TRADE_STOP_ORDER_TYPE_STOP_LOSS,
	TRADE_STOP_ORDER_TYPE_TAKE_PROFIT,
} from '@data-access-trade/order.constants';
import { StockInstrument } from 'types/stock';
import { TradeJournal } from 'types/trade';

interface DefaultIdea {
	entry: StockPositionIdeaEntry[];
	out: StockPositionTarget[];
	stop: StockPositionStop[];
}

const accumFn = <T, K extends keyof T>(list: T[], key: K): number =>
	list.reduce((acc: number, item: T): number => (acc += item[key] as number), 0);

const sortFn = (direction: boolean) =>
	direction
		? (a: { price: number }, b: { price: number }) => b.price - a.price
		: (a: { price: number }, b: { price: number }) => a.price - b.price;

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

	#switch = false;
	readonly #updateSwitcher$: Subject<boolean> = new BehaviorSubject(this.#switch);

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
		auto: new FormControl(true, { nonNullable: true }),
	});

	get controlPosition(): FormControl {
		return this.formGroup.get('position') as FormControl;
	}

	get controlIdea(): FormControl {
		return this.formGroup.get('idea') as FormControl;
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

	readonly positionAndLimit$: Observable<{ position: StockPosition; limit: TradeLimit }> = this.idea$.pipe(
		distinctUntilChanged((a, b) => a.idea.id === b.idea.id),
		switchMap((position: StockPosition) =>
			this.#api.getLimitForCurrency(position.idea.instrument.currencyId).pipe(
				map((response: Response<TradeLimit>) => ({
					limit: response.data,
					position,
				}))
			)
		),
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

	direction = true;

	mapOperationType: { [key: string]: string } = {
		'22': 'Продажа',
		'19': 'Комиссия',
		'15': 'Покупка',
	};

	mapOperationState: { [key: string]: string } = {
		2: 'Отмена',
		1: 'Исполнена',
	};

	onSwitch(event: Event): void {
		this.formArrayEntry.clear();
		this.formArrayOut.clear();
		this.formArrayStop.clear();

		this.#switch = !this.#switch;
		this.#updateSwitcher$.next(this.#switch);
	}

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

		this.idea$
			.pipe(
				tap((position: StockPosition) => this.controlPosition.setValue(position)),
				switchMap((position: StockPosition) =>
					combineLatest([
						this.orders$.pipe(
							filter((orders: TradeOrders | null): orders is TradeOrders => orders !== null),
							distinctUntilChanged((a, b) => this._distinctOrders(a, b))
						),
						this.stopOrders$.pipe(
							filter((orders: TradeStopOrders | null): orders is TradeStopOrders => orders !== null),
							distinctUntilChanged((a, b) => this._distinctStopOrders(a, b))
						),
						this.operations$.pipe(
							filter((operations: TradeOperations | null): operations is TradeOperations => operations !== null),
							distinctUntilChanged((a, b) => a.length === b.length)
						),
						this.portfolio$.pipe(
							filter((portfolio: TradePortfolio | null): portfolio is TradePortfolio => portfolio !== null)
						),
					]).pipe(
						switchMap(
							([orders, stopOrders, operations, portfolio]: [TradeOrders, TradeStopOrders, TradeOperations, TradePortfolio]) =>
								this.journal$.pipe(
									switchMap((journal: TradeJournal[] | null) => {
										if (journal === null) {
											return this.#api.getLimitForCurrency(position.idea.instrument.currencyId).pipe(
												map((response: Response<TradeLimit>) => this._getStartIdeaWithLimit(position, response.data.limit)),
												tap((idea: DefaultIdea) => this.controlIdea.setValue(idea)),
												map((idea: DefaultIdea) => this._initControlsFor(position, orders, stopOrders, operations, portfolio, idea))
											);
										}

										return of(journal).pipe(
											map((journal: TradeJournal[]) => {
												const { source, account } = this.controlFilter.value;

												return journal.filter(
													(item: TradeJournal) => item.sourceId === source.id && item.accountId === account.accountId
												);
											}),
											map((journal: TradeJournal[]) =>
												this._initControlsForJournal(position, journal, orders, stopOrders, operations, portfolio)
											)
										);
									})
								)
						)
					)
				)
			)
			.subscribe((res) => {
				console.log(res);

				this.formArrayEntry.clear();

				res.entry.forEach((item: any, index: number) => {
					this.formArrayEntry.setControl(index, new FormControl(item));
				});

				this.formArrayOut.clear();

				res.out.forEach((item: any, index: number) => {
					this.formArrayOut.setControl(index, new FormControl(item));
				});

				this.formArrayStop.clear();

				res.stop.forEach((item: any, index: number) => {
					this.formArrayStop.setControl(index, new FormControl(item));
				});
			});

		// this.idea$
		// 	.pipe(
		// 		filter((position: StockPosition) => position.idea.id !== null && +position.idea.id === +this.#context.data.id),
		// 		// distinctUntilChanged((a, b) => a.idea.id === b.idea.id),
		// 		tap((position: StockPosition) => {
		// 			this.controlPosition.setValue(position);
		// 		}),
		// 		switchMap((position: StockPosition) =>
		// 			combineLatest([
		// 				this.#api.getLimitForCurrency(position.idea.instrument.currencyId).pipe(
		// 					map((response: Response<TradeLimit>) => ({
		// 						limit: response.data,
		// 						position,
		// 					}))
		// 				),
		// 				this.orders$.pipe(
		// 					filter((orders: TradeOrders | null): orders is TradeOrders => orders !== null),
		// 					distinctUntilChanged((a, b) => this._distinctOrders(a, b))
		// 				),
		// 				this.stopOrders$.pipe(
		// 					filter((orders: TradeStopOrders | null): orders is TradeStopOrders => orders !== null),
		// 					distinctUntilChanged((a, b) => this._distinctStopOrders(a, b))
		// 				),
		// 				this.operations$.pipe(
		// 					filter((operations: TradeOperations | null): operations is TradeOperations => operations !== null),
		// 					distinctUntilChanged((a, b) => a.length === b.length)
		// 				),
		// 				this.portfolio$.pipe(
		// 					filter((portfolio: TradePortfolio | null): portfolio is TradePortfolio => portfolio !== null)
		// 				),
		// 				this.journal$,
		// 				this.#updateSwitcher$.asObservable(),
		// 			])
		// 		)
		// 	)
		// 	.pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(300))
		// 	.subscribe(
		// 		([{ position, limit }, orders, stopOrders, operations, portfolio, journal, switcher]: [
		// 			{ position: StockPosition; limit: TradeLimit },
		// 			TradeOrders,
		// 			TradeStopOrders,
		// 			TradeOperations,
		// 			TradePortfolio,
		// 			any,
		// 			boolean
		// 		]) => {
		// 			const updateIdea = this._updateIdeaActions(position, operations);
		//
		// 			if (updateIdea) {
		// 				return;
		// 			}
		//
		// 			// if (switcher) {
		// 			// 	// this._initControls(position, orders, stopOrders, operations, limit.limit);
		// 			// 	// this._initControlsForBot(position, orders, stopOrders, operations, limit.limit);
		// 			// } else {
		// 			// 	// this._initControlsForUser(position, orders, stopOrders, operations);
		// 			// }
		//
		// 			this._initControlsFor(position, orders, stopOrders, operations, journal, limit.limit, switcher);
		//
		// 			// if (position.idea.author !== 'bot') {
		// 			//
		// 			// 	return;
		// 			// }
		// 			//
		// 			// if (position.idea.author === 'user') {
		// 			// 	console.log('dsfsdfdsf');
		// 			// }
		//
		// 			// console.log('_initControls', position, orders, stopOrders, operations);
		// 		}
		// 	);

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
			}
		});

		combineLatest([
			this.listEntry$.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter((list: ControlValue[]) => list.length === 1),
				map((value: ControlValue[]) => value[0].lots),
				distinctUntilChanged(),
				skip(1)
			),
			this.idea$,
		]).subscribe(([entryLots, position]) => {
			const outs = this.#service.getOutControlValue(position, [], [], [], this.controlFilter.value, entryLots);

			this.formArrayOut.clear({ emitEvent: false });
			outs.ideas.forEach((value: TradeJournal, index: number) => {
				this.formArrayOut.setControl(index, new FormControl(value));
			});

			const stopControlValue: ControlValue | null = this.formArrayStop.value[0] || null;

			if (stopControlValue) {
				this.formArrayStop.setControl(
					0,
					new FormControl({
						...stopControlValue,
						quantity: entryLots * stopControlValue.lot,
						lots: entryLots,
						total: getNumberPrecision(
							(stopControlValue.stopPrice || stopControlValue.price) * entryLots * stopControlValue.lot,
							2
						),
					})
				);
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

	trackBy(index: number, item: ControlValue): ControlValue {
		return item;
	}

	writeValue(obj: any): void {
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
		if (this.#store.isOrder(item.orderTypeText)) {
			this.onRemoveOrder(event, { ...item, id: item.orderId });
		}

		if (this.#store.isStopOrder(item.orderTypeText)) {
			this.onRemoveStopOrder(event, { ...item, id: item.stopOrderId });
		}
	}

	onRemoveOrder(event: Event, item: { id: string | null; removed: boolean }): void {
		event.preventDefault();
		const { account, source, instrument } = this.controlFilter.value;

		item['removed'] = true;

		this.#store.removeOrder({
			accountId: account.accountId,
			id: item.id,
			sourceId: source.id,
			instrumentId: instrument.id,
		});
	}

	onRemoveStopOrder(event: Event, item: { id: string | null; removed: boolean }): void {
		event.preventDefault();

		item['removed'] = true;

		const { account, source, instrument } = this.controlFilter.value;

		this.#store.removeStopOrder({
			accountId: account.accountId,
			id: item.id,
			sourceId: source.id,
			instrumentId: instrument.id,
		});
	}

	private _updateIdeaEntries(
		position: StockPosition,
		entries: TradeOperations,
		outs: TradeOperations,
		commissions: TradeOperations
	): void {
		const id = position.idea.id;
		console.log('_updateIdeaEntries');
		if (id) {
			this.#idea.editIdea({
				id,
				body: this.#service.updateIdea(position, entries, outs, commissions),
			});
		}
	}

	onOpen(event: Event, control: FormArray, direction: boolean, type: 'out' | 'entry' | 'stop' = 'entry') {
		event.preventDefault();

		const { instrument, lastPrice } = this.controlFilter.value;

		const minPriceIncrement = getNumberPrecision(instrument.minPriceIncrement * 3, 2);
		let max = null;

		if (type === 'out' && this.formArrayEntry.value && this.formArrayEntry.value.length > 0) {
			max = this.formArrayEntry.value.reduce((acc: number, item: { lots: number }) => {
				return acc + item.lots;
			}, 0);
		}

		this.#dialog
			.openTradeRequest(this.#injector, {
				data: {
					direction: { value: direction, disabled: true },
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
						status: ControlValueStatus.UNLOADING,
						commission: 0,
						change: false,
						removed: false,
						lot: instrument.lot,
						lots: Math.floor(value.quantity / instrument.lot),
						total: getNumberPrecision(value.price * value.quantity, 2),
					};
					control.setControl(control.controls.length, new FormControl(calcValue));
				}
			});
	}

	onEdit(event: Event, item: ControlValue, index: number, control: FormArray): void {
		event.preventDefault();

		item['change'] = true;

		const { account, source, instrument, lastPrice } = this.controlFilter.value;
		const minPriceIncrement = getNumberPrecision(instrument.minPriceIncrement * 3, 2);

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
				let calcValue: Partial<ControlValue & { orderTypePrev: TradeOrderType | null }> = {
					...item,
					change: false,
					orderTypePrev: item.orderType,
				};

				if (value) {
					calcValue = {
						...calcValue,
						...value,
						change: item.status === ControlValueStatus.AWAITS,
						total: getNumberPrecision(value.price * value.lots * item.lot, 2),
					};

					if (item.status === ControlValueStatus.AWAITS && item.orderType) {
						this.#store.changeOrder({
							...calcValue,
							quantity: calcValue.lots,
							instrumentId: instrument.id,
							accountId: account.accountId,
							sourceId: source.id,
						});
					}
				}

				control.setControl(index, new FormControl(calcValue));
			});
	}

	onRemoveWithControl(event: Event, item: ControlValue, index: number, control: FormArray): void {
		event.preventDefault();

		if (item.status === ControlValueStatus.AWAITS) {
			if (item.orderType) {
				if (this.#store.isOrder(item.orderType.type)) {
					this.onRemoveOrder(event, item);
				}

				if (this.#store.isStopOrder(item.orderType.type)) {
					this.onRemoveStopOrder(event, item);
				}
			}

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
		event.preventDefault();

		this.positionAndLimit$
			.pipe(takeUntilDestroyed(this.#destroyRef), take(1))
			.subscribe(({ position, limit }: { position: StockPosition; limit: TradeLimit }) => {
				const entry = this.#service.getIdeaControlValue(position, this.controlFilter.value, limit.limit);
				const maxLots = entry.reduce((acc: number, item: TradeJournal) => (acc += item.lots), 0);
				const startIndexEntry = this.formArrayEntry.value.length;
				const startIndexOut = this.formArrayOut.value.length;
				const startIndexStop = this.formArrayStop.value.length;
				const outs = this.#service.getOutControlValue(position, [], [], [], this.controlFilter.value, maxLots);
				const stop = this.#service.getIdeaStopLossControlValue(position, maxLots, []);

				entry.forEach((item, index: number) => {
					this.formArrayEntry.setControl(startIndexEntry + index + length, new FormControl(item));
				});

				outs.ideas.forEach((item, index: number) => {
					this.formArrayOut.setControl(startIndexOut + index, new FormControl(item));
				});

				stop.forEach((item, index: number) => {
					this.formArrayStop.setControl(startIndexStop + index, new FormControl(item));
				});
			});
	}

	addFromIdeaEntry(event: Event): void {
		event.preventDefault();

		this.positionAndLimit$
			.pipe(takeUntilDestroyed(this.#destroyRef), take(1))
			.subscribe(({ position, limit }: { position: StockPosition; limit: TradeLimit }) => {
				const entry = this.#service.getIdeaControlValue(position, this.controlFilter.value, limit.limit);
				const startIndex = this.formArrayEntry.value.length;

				entry.forEach((item, index: number) => {
					this.formArrayEntry.setControl(startIndex + index + length, new FormControl(item));
				});
			});
	}

	addFromIdeaOut(event: Event): void {
		event.preventDefault();

		this.positionAndLimit$
			.pipe(takeUntilDestroyed(this.#destroyRef), take(1))
			.subscribe(({ position, limit }: { position: StockPosition; limit: TradeLimit }) => {
				const entry = this.#service.getIdeaControlValue(position, this.controlFilter.value, limit.limit);
				const maxLots = entry.reduce((acc: number, item: TradeJournal) => (acc += item.lots), 0);
				const outs = this.#service.getOutControlValue(position, [], [], [], this.controlFilter.value, maxLots);
				const startIndex = this.formArrayOut.value.length;

				outs.ideas.forEach((item, index: number) => {
					this.formArrayOut.setControl(startIndex + index + length, new FormControl(item));
				});
			});
	}

	addFromIdeaStop(event: Event): void {
		event.preventDefault();

		this.positionAndLimit$
			.pipe(takeUntilDestroyed(this.#destroyRef), take(1))
			.subscribe(({ position, limit }: { position: StockPosition; limit: TradeLimit }) => {
				const entry = this.#service.getIdeaControlValue(position, this.controlFilter.value, limit.limit);
				const maxLots = entry.reduce((acc: number, item: TradeJournal) => (acc += item.lots), 0);
				const stop = this.#service.getIdeaStopLossControlValue(position, maxLots, []);
				const startIndexStop = this.formArrayStop.value.length;

				stop.forEach((item, index: number) => {
					this.formArrayStop.setControl(startIndexStop + index, new FormControl(item));
				});
			});
	}

	// private _initControls(
	// 	position: StockPosition,
	// 	orders: TradeOrders,
	// 	stopOrders: TradeStopOrders,
	// 	operations: TradeOperations,
	// 	limit: number | null = null
	// ): void {
	// 	this.direction = position.idea.positionType === 'long';
	//
	// 	const operationTypeEntry = this.#service.getOperationType(this.direction);
	// 	const operationTypeOut = this.#service.getOperationType(!this.direction);
	// 	const actualOperations = this.#service.getActualOperations(position, operations);
	//
	// 	const entry: {
	// 		orders: TradeControlValue[];
	// 		actions: TradeControlValue[];
	// 		ideas: TradeControlValue[];
	// 	} = this.#service.getEntryControlValue(
	// 		position,
	// 		orders,
	// 		stopOrders,
	// 		actualOperations.filter((item) => item.type === operationTypeEntry),
	// 		this.controlFilter.value,
	// 		limit
	// 	);
	//
	// 	const tempEntry: TradeControlValue[] = this.formArrayEntry
	// 		? this.formArrayEntry.value.filter((item: ControlValue) => item.status === ControlValueStatus.UNLOADING)
	// 		: [];
	// 	const tempOut: TradeControlValue[] = this.formArrayOut.value
	// 		? this.formArrayOut.value.filter((item: ControlValue) => item.status === ControlValueStatus.UNLOADING)
	// 		: [];
	// 	const tempStop: TradeControlValue[] = this.formArrayStop.value
	// 		? this.formArrayStop.value.filter((item: ControlValue) => item.status === ControlValueStatus.UNLOADING)
	// 		: [];
	//
	// 	this.formArrayEntry.clear({ emitEvent: false });
	// 	this.formArrayOut.clear({ emitEvent: false });
	// 	this.formArrayStop.clear({ emitEvent: false });
	//
	// 	this._setControl(this.formArrayEntry, tempEntry, entry, this.direction);
	//
	// 	const compose = this.formArrayEntry.value.filter(
	// 		(item: ControlValue) => item.status !== ControlValueStatus.UNLOADING
	// 	);
	//
	// 	const maxLots: number = this.formArrayEntry.value.reduce((acc: number, item: ControlValue) => (acc += item.lots), 0);
	// 	const outOperations = actualOperations.filter((item) => item.type === operationTypeOut);
	//
	// 	const out: {
	// 		orders: TradeControlValue[];
	// 		actions: TradeControlValue[];
	// 		ideas: TradeControlValue[];
	// 	} = this.#service.getOutControlValue(position, orders, stopOrders, outOperations, this.controlFilter.value, maxLots);
	//
	// 	this._setControl(this.formArrayOut, tempOut, out, !this.direction, compose.length === 0);
	//
	// 	const stopLoss = this.#service.getStopLossControlValue(
	// 		position,
	// 		maxLots,
	// 		tempStop,
	// 		orders,
	// 		stopOrders,
	// 		outOperations
	// 	);
	//
	// 	this._setControl(this.formArrayStop, tempStop, stopLoss, !this.direction, compose.length === 0);
	//
	// 	// console.log(entry, out, stopLoss);
	//
	// 	this.formArrayEntry.patchValue([]);
	// 	this.formArrayOut.patchValue([]);
	// 	this.formArrayStop.patchValue([]);
	// }

	private _getDataForRequestForm(item: ControlValue) {
		return {
			direction: { value: item.direction, disabled: true },
			expirationType: { value: item.expirationType, disabled: false },
			expireDate: { value: item.expireDate, disabled: false },
			orderType: { value: item.orderType, disabled: false },
			price: { value: item.price, disabled: false },
			lot: { value: item.lot, disabled: false },
			stopPrice: { value: item.stopPrice, disabled: false },
			trailingData: { value: item.trailingData, disabled: false },
			quantity: { value: item.quantity, disabled: false },
		};
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

	private _setControl(
		formArray: FormArray,
		tempControlValues: TradeJournal[],
		controlValues: {
			orders: TradeJournal[];
			actions: TradeJournal[];
			ideas: TradeJournal[];
		},
		direction: boolean,
		compose = true
	): void {
		if (tempControlValues.length === 0) {
			let concatControlValues = [...controlValues.orders, ...controlValues.actions];

			if (compose) {
				concatControlValues = [...concatControlValues, ...controlValues.ideas];
			}

			concatControlValues.sort(sortFn(direction)).forEach((item: TradeJournal, index: number) => {
				formArray.setControl(index, new FormControl(item), { emitEvent: false });
			});
		}

		if (tempControlValues.length > 0) {
			const concatControlValues = [...controlValues.actions, ...controlValues.orders];
			const copyControlValues: (TradeJournal | null)[] = concatControlValues.map((item) => ({ ...item }));

			tempControlValues.forEach((item: TradeJournal, index: number) => {
				const findIndex = concatControlValues.findIndex((control: TradeJournal) => control.lots === item.lots);

				let control = item;

				if (findIndex !== -1) {
					control = {
						...control,
						id: concatControlValues[findIndex].id,
						status: concatControlValues[findIndex].status,
					};
					copyControlValues[findIndex] = null;
					concatControlValues[findIndex].lot = -1;
				}

				formArray.setControl(index, new FormControl(control), { emitEvent: false });
			});

			if (tempControlValues.length !== copyControlValues.length) {
				copyControlValues.forEach((item: TradeJournal | null, index: number) => {
					if (item !== null) {
						formArray.setControl(index, new FormControl(item), { emitEvent: false });
					}
				});
			}
		}
	}

	private _initControlsFor(
		position: StockPosition,
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operations: TradeOperations,
		portfolio: TradePortfolio,
		idea: DefaultIdea
	) {
		const actualOperations = this.#service.getActualOperations(position, operations);
		const operationTypeEntry = this.#service.getOperationType(this.direction);
		const operationTypeOut = this.#service.getOperationType(!this.direction);
		const {
			account: { accountId },
			source,
		} = this.controlFilter.value;

		const entriesUnloadingControlValue = this.#service.getUnloadingControlValue(
			accountId,
			source,
			position,
			idea.entry,
			TRADE_ORDER_TYPE_LIMIT
		);

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

		const targets = calculateTargets(
			position.idea.positionType as 'long' | 'short',
			position.idea.targets,
			idea.entry,
			position.idea.instrument.lot,
			position.idea.minPriceIncrement
		);

		const targetsUnloadingControlValue = this.#service.getUnloadingControlValue(
			accountId,
			source,
			position,
			targets,
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

		const stops = calculateStop(
			position.idea.positionType as 'long' | 'short',
			position.idea.stop ? [position.idea.stop] : [],
			idea.entry,
			position.idea.instrument.lot,
			position.idea.instrument.minPriceIncrement
		);

		const stopsUnloadingControlValue = this.#service.getUnloadingControlValue(
			accountId,
			source,
			position,
			stops,
			TRADE_STOP_ORDER_TYPE_STOP_LOSS,
			'reverse'
		);

		return {
			entry: [...entriesUnloadingControlValue, ...entriesExecutedControlValue, ...entriesAwaitsControlValue],
			out: [...targetsUnloadingControlValue, ...targetsExecutedControlValue, ...targetsAwaitsControlValue],
			stop: stopsUnloadingControlValue,
		};
	}

	private _initControlsForJournal(
		position: StockPosition,
		journal: TradeJournal[],
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operations: TradeOperations,
		portfolio: TradePortfolio
	) {
		const entry = this.#service.getEntryFromJournal(position, journal);

		if (entry.filter((item) => item.status !== ControlValueStatus.EXECUTED).length) {
			this._updateTradeJournal(entry, orders, stopOrders, operations);
		}
		const out = this.#service.getOutFromJournal(position, journal);

		if (out.filter((item) => item.status !== ControlValueStatus.EXECUTED).length) {
			this._updateTradeJournal(out, orders, stopOrders, operations);
		}

		const stop = this.#service.getStopFromJournal(position, journal);

		if (stop.filter((item) => item.status !== ControlValueStatus.EXECUTED).length) {
			this._updateTradeJournal(stop, orders, stopOrders, operations);
		}

		return {
			entry,
			out,
			stop,
		};
	}

	private _updateTradeJournal(
		journal: TradeJournal[],
		orders: TradeOrders,
		stopOrders: TradeStopOrders,
		operations: TradeOperations
	): void {
		const filter = this.controlFilter.value;
		const params = {
			sourceId: filter.source && filter.source.id,
			accountId: filter.account && filter.account.accountId,
			instrumentId: filter.instrument && filter.instrument.id,
		};

		if (orders.length) {
			journal.forEach((item: TradeJournal) => {
				if (item.status !== ControlValueStatus.EXECUTED) {
					const findOrder: TradeOrder | null =
						orders.find((order: TradeOrder) => +order.direction === +item.direction && order.lotsRequested === item.lots) ||
						null;

					if (findOrder) {
						this.#store.setJournalItem({
							params,
							item: {
								...item,
								externalId: findOrder.orderId,
								price: findOrder.averagePositionPrice.value,
								status: ControlValueStatus.AWAITS,
							},
						});
						return;
					}
				}
			});
		}

		if (stopOrders.length) {
			journal.forEach((item: TradeJournal) => {
				if (item.status !== ControlValueStatus.EXECUTED) {
					const findOrder =
						stopOrders.find(
							(order: TradeStopOrder) => +order.direction === +item.direction && order.lotsRequested === item.lots
						) || null;

					if (findOrder) {
						this.#store.setJournalItem({
							params,
							item: {
								...item,
								externalId: findOrder.stopOrderId,
								price: findOrder.price.value,
								stopPrice: findOrder.stopPrice.value,
								status: ControlValueStatus.AWAITS,
							},
						});
						return;
					}
				}
			});
		}

		if (operations.length) {
			journal.forEach((item: TradeJournal) => {
				if (item.status !== ControlValueStatus.EXECUTED) {
					const findOperation: TradeOperation | null =
						operations.find((operation: TradeOperation) => operation.quantity === item.quantity) || null;

					if (findOperation) {
						this.#store.setJournalItem({
							params,
							item: {
								...item,
								price: findOperation.price.value,
								status: ControlValueStatus.EXECUTED,
							},
						});
						return;
					}
				}
			});
		}
	}

	private _updateIdeaActions(position: StockPosition, operations: TradeOperations): boolean {
		const direction = position.idea.positionType === 'long';
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
			this._updateIdeaEntries(position, operationsEntryPosition, operationsOutPosition, operationsCommissions);

			return true;
		}

		return false;
	}

	private _getStartIdeaWithLimit(position: StockPosition, limit: number | null): DefaultIdea {
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
}
