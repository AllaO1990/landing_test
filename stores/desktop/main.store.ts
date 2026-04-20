import {FacadeStore} from './facade';
import {SelectStore} from './select.store';
import {DesktopService} from '@desktop-data/desktop-data';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import {inject, Injectable} from '@angular/core';
import {StockEvent} from 'types/stock-event';
import {filter, map} from 'rxjs/operators';
import {EventSelected} from 'types/events';
import {ComponentStore} from '@ngrx/component-store';
import {StockId, StockInstrument, StockPrice, StockTransaction, WithLastPrice} from 'types/stock';
import {DateRange} from 'types/date-range';
import {Timeframe} from 'types/timeframe';
import {GLOBAL_DATE_RANGE, QUERY_PARAMS} from 'tokens/desktop';
import {IntervalStore} from 'stores/plugins/interval.store';
import {QueryParams} from 'utils/query-params';
import {Response} from 'types/response';
import {StockPosition} from 'types/position';
import {HttpErrorResponse} from '@angular/common/http';

const TIMER_INTERVAL = 60 * 1000;

const timerWithIndex = <T>(
	source$: Observable<T>,
	interval: number = 10000,
	start: number = 0
): Observable<{ source: T; index: number }> => {
	return source$.pipe(
		switchMap((source: T) => timer(start, interval).pipe(map((index: number) => ({ source, index }))))
	);
};

@Injectable()
export class MainStore extends ComponentStore<any> {
	private readonly _today = new Date(new Date().setUTCHours(0, 0, 0, 0));
	private readonly _range$: Observable<DateRange> = inject(GLOBAL_DATE_RANGE);
	private _destroyed$ = new Subject<void>();
	private _queryParams: QueryParams = inject(QUERY_PARAMS);

	private readonly _facade = new FacadeStore(this.api, this._queryParams);

	readonly account = this._facade.account;
	readonly interval = new IntervalStore();
	readonly selected = new SelectStore();
	readonly stock = this._facade.stockList;
	readonly idea = this._facade.idea;
	readonly price = this._facade.priceList;
	readonly candles = this._facade.candles;
	readonly sma = this._facade.sma;
	readonly ema = this._facade.ema;
	readonly consolidationZones = this._facade.consolidationZones;
	readonly consolidationZonesIdea = this._facade.consolidationZonesIdea;
	readonly consolidationZonesWatch = this._facade.consolidationZonesWatch;
	readonly figures = this._facade.figures;
	readonly atr = this._facade.atr;
	readonly portfolio = this._facade.portfolio;

	constructor(private readonly api: DesktopService) {
		super();

		this._init();
	}

	private _init(): void {
		const timerSource = timer(0, TIMER_INTERVAL).pipe(shareReplay({ bufferSize: 1, refCount: true }));

		const interval$: Observable<Timeframe> = this.interval.interval$.pipe(shareReplay({ bufferSize: 1, refCount: true }));

		const instrumentTrust$: Observable<StockInstrument> = this.idea.instrument$.pipe(
			filter((instrument: StockInstrument | null): instrument is StockInstrument => instrument !== null),
			distinctUntilChanged((a, b) => a.id === b.id),
			shareReplay({ refCount: true, bufferSize: 1 })
		);

		const eventWithoutDialog$ = this.selected.event$.pipe(
			filter((value: null | StockEvent) => {
				if (value === null) {
					return false;
				}
				return !value['dialog'];
			}),
			shareReplay({ refCount: true, bufferSize: 1 })
		);

		// this.stock.loadList();
		this.stock.loadGroup();

		this.account.loadBrokers();
		this.account.loadCurrencies();
		this.account.loadPortfolios();
		this.account.loadStrategies();
		this.account.loadTypes();

		// this.ideas.loadIdeas(timerSource);
		// this.ideas.loadPositions(timerSource);

		this.onChangeQueryParams(this.selected.event$);
		// this.onChangeInstrument(this.selected.event$);
		// this.onChangePosition(this.selected.event$);
		// this.onChangeIdea(this.selected.event$);
		// this.onChangeWatch(eventWithoutDialog$);
		// this.onChangeTransaction(eventWithoutDialog$);

		this.candles.loadCandles(
			timerWithIndex(
				instrumentTrust$.pipe(
					distinctUntilChanged((a: StockInstrument, b: StockInstrument) => a.id === b.id),
					debounceTime(0)
				),
				TIMER_INTERVAL
			)
		);

		this.ema.load(
			combineLatest([
				instrumentTrust$.pipe(map((instrument: StockInstrument) => instrument.id)),
				this.ema.selected$.pipe(
					filter((selected: null | any): selected is any => selected !== null),
					distinctUntilChanged((a: string[], b: string[]) => a.toString() === b.toString())
				),
				this._range$,
				interval$,
			]).pipe(
				debounceTime(100),
				map(([id, types, period, interval]: [string, string[], DateRange, Timeframe]) => ({
					id,
					types,
					period,
					interval,
				}))
			)
		);
		this.sma.load(
			combineLatest([
				instrumentTrust$.pipe(map((instrument: StockInstrument) => instrument.id)),
				this.sma.selected$.pipe(
					filter((selected: null | any): selected is any => selected !== null),
					distinctUntilChanged((a: string[], b: string[]) => a.toString() === b.toString())
				),
				this._range$,
				interval$,
			]).pipe(
				debounceTime(100),
				map(([id, types, period, interval]: [string, string[], DateRange, Timeframe]) => ({
					id,
					types,
					period,
					interval,
				}))
			)
		);
		this.consolidationZones.load(
			combineLatest([
				instrumentTrust$.pipe(map((instrument: StockInstrument) => instrument.id)),
				this.consolidationZones.selected$.pipe(
					filter((selected: number[] | null): selected is number[] => selected !== null)
				),
				this._range$,
			]).pipe(
				debounceTime(0),
				map(([id, zones, range]: [string, number[] | null, DateRange]) => {
					if (zones === null || zones.length === 0) {
						return null;
					}

					return {
						id,
						interval: zones,
						...range,
					};
				})
			)
		);
		this.consolidationZonesIdea.load(
			this.selected.common$.pipe(
				filter((transaction: StockTransaction | null): transaction is StockTransaction => transaction !== null),
				distinctUntilChanged((a, b) => a === b)
			)
		);
		this.consolidationZonesWatch.load(
			this.selected.event$.pipe(
				filter((event: null | StockEvent): event is StockEvent => event !== null),
				map((event: StockEvent) => (event.type === EventSelected.WATCH_LIST ? event : null)),
				distinctUntilChanged()
			)
		);
		this.figures.load(
			this.selected.common$
				.pipe
				// distinctUntilChanged((a, b) => a !== null && a === b)
				()
		);
		this.atr.load(
			combineLatest([
				this.selected.instrument$.pipe(
					filter((instrument: string | null): instrument is string => instrument !== null),
					distinctUntilChanged()
				),
				this.atr.selected$.pipe(distinctUntilChanged()),
				interval$,
			]).pipe(
				map(([id, selected, interval]: [string, boolean, Timeframe]) => {
					if (!selected) {
						return null;
					}

					return {
						id,
						interval,
						date: this._today.toISOString(),
					};
				})
			)
		);
	}

	onLoadPrice = (stream$: string[] | null) => {
		this._destroyed$.next();

		return this.price.load(
			of(stream$).pipe(
				switchMap(() => timer(0, TIMER_INTERVAL).pipe(takeUntil(this._destroyed$))),
				map(() => stream$)
			)
		);
	};

	unLoadPrice = () => {
		this._destroyed$.next();
	};

	// onChangeInstrument = this.effect((source$: Observable<null | StockEvent>) =>
	//   source$.pipe(
	//     filter((event: StockEvent | null): event is StockEvent => event !== null),
	//     filter((event: StockEvent) => event.type === EventSelected.STOCK_LIST || event.type === EventSelected.WATCH_LIST),
	//     switchMap((event: StockEvent) =>
	//       this.api
	//         .getStockInstrument(event.id)
	//         .pipe(
	//           tap((response: Response<StockInstrument>) =>
	//             this._updateSelected(response.data, null, null, null, event.group)
	//           )
	//         )
	//     )
	//   )
	// );

	/**
	 *  distinctUntilChanged на id, но не обновляется, если дефолтные значения при создание
	 */
	onChangeQueryParams = this.effect((source$: Observable<null | StockEvent>) =>
		source$.pipe(
			filter((event: StockEvent | null): event is StockEvent => event !== null),
			filter((event: StockEvent) => event.id !== null),
			distinctUntilChanged((a, b) => a.id === b.id),
			// distinctUntilChanged((a, b) => a.id === b.id && a.dialog !== b.dialog && a.trade === b.trade),
			// tap((data) => console.log(data)),
			switchMap((event: StockEvent) => {
				if (event.type === EventSelected.WATCH_LIST || event.type === EventSelected.STOCK_LIST) {
					return this.api.getStockInstrument(event.id.toString()).pipe(
						map((response: Response<StockInstrument>) => response.data),
						tap((instrument: StockInstrument) => {
							this.idea.updateInstrument(instrument);
							this.idea.updateIdea(null);

							this._updateSelected({
								instrument: instrument.id,
								idea: null,
								group: event.group || null,
							});
						})
					);
				}

				if (
					event.type === EventSelected.POSITION ||
					event.type === EventSelected.IDEA ||
					event.type === EventSelected.TRANSACTION
				) {
					return this.api.getIdea(event.id).pipe(
						catchError((error: HttpErrorResponse) => {
							if (error.status === 302 && error.error.data) {
								this._queryParams.update({
									type: EventSelected.IDEA,
									id: error.error.data,
								});

								return of();
							}

							return of(error.error);
						}),
						map((response: Response<StockPosition | null>) => response.data),
						tap((position: StockPosition | null) => {
							this.idea.updateIdea(position);
							position && this.idea.updateInstrument(position.idea.instrument);

							this._updateSelected({
								instrument: position && position.idea.instrument.id,
								group: null,
								idea: position && position.idea.id,
							});
						})
					);
				}

				return timer(3000).pipe(
					tap(() => this._queryParams.update({}, '')),
					tap(() => {
						this._updateSelected({
							instrument: null,
							idea: null,
							group: null,
						});
					})
				);
			})
		)
	);

	// onChangePosition = this.effect((source$: Observable<StockEvent | null>) =>
	//   combineLatest([
	//     source$.pipe(
	//       filter((event: null | StockEvent): event is StockEvent => event !== null),
	//       map((event: StockEvent) =>
	//         event.type === EventSelected.POSITION || event.type === EventSelected.IDEA ? event : null
	//       ),
	//       distinctUntilChanged()
	//     ),
	//     combineLatest([
	//       this._facade.ideas.positions$.pipe(filter((list: Position[] | null): list is Position[] => list !== null)),
	//       this._facade.ideas.ideas$.pipe(filter((list: Position[] | null): list is Position[] => list !== null)),
	//     ]).pipe(map(([positions, ideas]: [Position[], Position[]]) => [...positions, ...ideas])),
	//   ]).pipe(
	//     debounceTime(500),
	//     filter((combine: [StockEvent | null, Position[]]): combine is [StockEvent, Position[]] => combine[0] !== null),
	//     tap(([event, list]: [StockEvent, Position[]]) => {
	//       const find = list.find((item: Position) => item.id === event.id) || null;
	//
	//       if (find) {
	//         if (event.type === EventSelected.POSITION) {
	//           this._updateSelected(find.instrument, { ideaId: find.id, instrumentId: find.instrument.id });
	//         } else {
	//           this._updateSelected(find.instrument, null, { ideaId: find.id, instrumentId: find.instrument.id });
	//         }
	//       } else {
	//         // this._queryParams.update({}, '');
	//         this._updateSelected();
	//       }
	//     })
	//   )
	// );

	// onChangeIdea = this.effect((source$: Observable<StockEvent | null>) =>
	//   combineLatest([
	//     source$.pipe(this._getIdFrom(EventSelected.IDEA)),
	//     forkJoin([
	//       this._facade.ideas.positions$.pipe(filter((list: Position[] | null): list is Position[] => list !== null)),
	//       this._facade.ideas.ideas$.pipe(filter((list: Position[] | null): list is Position[] => list !== null)),
	//     ]).pipe(map(([positions, ideas]: [Position[], Position[]]) => [...positions, ...ideas])),
	//   ]).pipe(
	//     filter((combine: [StockEvent | null, Position[]]): combine is [StockEvent, Position[]] => combine[0] !== null),
	//     tap(([event, list]: [StockEvent, Position[]]) => {
	//       const find = list.find((item: Position) => item.id === event.id) || null;
	//
	//       if (find) {
	//         this._updateSelected(find.instrument, null, { ideaId: find.id, instrumentId: find.instrument.id });
	//       } else {
	//         this._queryParams.update({}, '');
	//         this._updateSelected();
	//       }
	//     })
	//   )
	// );

	// onChangeWatch = this.effect((source$: Observable<StockEvent | null>) =>
	//   source$.pipe(
	//     this._getIdFrom(EventSelected.WATCH_LIST),
	//     filter((event: StockEvent | null): event is StockEvent => event !== null),
	//     switchMap((event: StockEvent) =>
	//       this.api
	//         .getStockInstrument(event.id)
	//         .pipe(
	//           tap((response: Response<StockInstrument>) =>
	//             this._updateSelected(response.data, null, null, null, event.group)
	//           )
	//         )
	//     )
	//   )
	// );

	// onChangeTransaction = this.effect((source$: Observable<StockEvent | null>) =>
	//   combineLatest([
	//     source$.pipe(this._getIdFrom(EventSelected.TRANSACTION)),
	//     this.portfolio.list$.pipe(
	//       filter((list: PortfolioPosition[] | null): list is PortfolioPosition[] => list !== null)
	//     ),
	//   ]).pipe(
	//     filter(
	//       (combine: [StockEvent | null, PortfolioPosition[]]): combine is [StockEvent, PortfolioPosition[]] =>
	//         combine[0] !== null
	//     ),
	//     tap(([event, list]: [StockEvent, PortfolioPosition[]]) => {
	//       const find = list.find((item: PortfolioPosition) => item.ideaId === event.id) || null;
	//
	//       if (find) {
	//         this._updateSelected(find.instrument, null, null, { ideaId: find.ideaId, instrumentId: find.instrument.id });
	//       } else {
	//         this._queryParams.update({}, '');
	//         this._updateSelected({
	//           instrument: null,
	//           ideas: null,
	//           group: null,
	//         });
	//       }
	//     })
	//   )
	// );

	getPriceOfInstruments = (list: string[]): Observable<StockPrice<WithLastPrice>> => this.api.getActiveStock(list);

	private _updateSelected(selected: { instrument: string | null; idea: StockId | null; group: string | null }): void {
		this.selected.updateInstrument(selected.instrument);
		this.selected.updateIdea(selected.idea);
		this.selected.updateGroup(selected.group);
	}

	private _getIdFrom(type: EventSelected) {
		return (source$: Observable<StockEvent | null>) =>
			source$.pipe(
				filter((event: null | StockEvent): event is StockEvent => event !== null),
				map((event: StockEvent) => (event.type === type ? event : null)),
				distinctUntilChanged()
			);
	}
}
