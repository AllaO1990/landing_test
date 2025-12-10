import { TuiTable } from '@taiga-ui/addon-table';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { WRAPPER_TABLE_HEADER } from './table.constants';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { TuiFormatNumberPipe, TuiHint, TuiIcon, TuiScrollable, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { StockId } from 'types/stock';
import { GetStrategyNamePipe } from '@ui/pipes/get-strategy-name.pipe';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  merge,
  Observable,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { PortfolioPosition } from 'types/portfolio';
import { LoaderComponent } from '@ui/components/loader';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { EventSelected } from 'types/events';
import { ColorPriceDirective } from '@ui/components/price';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiPagination } from '@taiga-ui/kit';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AccountBroker, AccountCurrency, AccountPortfolio, AccountStrategy, AccountType } from 'types/account';
import { GetBrokerPipe } from '@ui/pipes/get-broker.pipe';
import { Params } from '@angular/router';
import { getPriceIncrement } from 'utils/get-price-increment';

@Component({
  selector: 'lib-wrapper-table',
  standalone: true,
  imports: [
    TuiTable,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
    AsyncPipe,
    CdkVirtualForOf,
    DatePipe,
    TuiFormatNumberPipe,
    GetStrategyNamePipe,
    NgIf,
    TuiIcon,
    TuiScrollable,
    LoaderComponent,
    NgTemplateOutlet,
    TuiHint,
    ColorPriceDirective,
    TuiPagination,
    TuiTextfieldOptionsDirective,
    TuiSelectModule,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    GetBrokerPipe,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WrapperTableComponent implements OnInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _service: PortfolioFacade = inject(PortfolioFacade);
  readonly #inputParams$: Subject<Params> = new Subject();

  readonly size = 's';
  readonly columns = [
    'date',
    'positionType',
    'ticker',
    'entry',
    'entryPosition',
    'out',
    'outPosition',
    'dividend',
    'profitRealized',
    'remainderInPosition',
    'profitNotRealized',
    'result',
    'deposit',
    'strategy',
    'broker',
    'comment',
    'author',
  ];
  readonly listLimit: number[] = [10, 50, 100];
  readonly controlLimit: FormControl = new FormControl<number>(this.listLimit[1]);
  readonly header = WRAPPER_TABLE_HEADER;

  isData: boolean | null = null;

  public activeIdeaId$: Observable<StockId | null> = this._service.select$.pipe(
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  index$: Subject<number> = new BehaviorSubject(0);
  isLoad$: Subject<boolean> = new BehaviorSubject(false);

  data$: Observable<PortfolioPosition[] | null> = this._service.list$.pipe(
    map(
      (data: PortfolioPosition[] | null) =>
        data &&
        data.map((item) => ({
          ...item,
          priceIncrement: getPriceIncrement(item.instrument.minPriceIncrement),
        }))
    ),
    tap((data: PortfolioPosition[] | null) => {
      this.isData = data && !!data.length;

      this.isLoad$.next(false);
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  portfolio$: Observable<AccountPortfolio> = this._service.portfolio$.pipe(
    filter((list: null | AccountPortfolio): list is AccountPortfolio => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  broker$: Observable<AccountBroker> = this._service.broker$.pipe(
    filter((list: null | AccountBroker): list is AccountBroker => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  type$: Observable<AccountType> = this._service.type$.pipe(
    filter((list: null | AccountType): list is AccountType => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  strategy$: Observable<AccountStrategy> = this._service.strategy$.pipe(
    filter((list: null | AccountStrategy): list is AccountStrategy => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  currency$: Observable<AccountCurrency> = this._service.currency$.pipe(
    filter((list: null | AccountCurrency): list is AccountCurrency => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  range$: Observable<any> = this._service.range$.pipe(
    filter((list: null | any): list is any => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  storeStream$: Observable<Params> = combineLatest([
    this.portfolio$,
    this.broker$,
    this.currency$,
    this.type$,
    this.strategy$,
  ]).pipe(
    map(
      ([portfolio, broker, currency, type, strategy]: [
        AccountPortfolio,
        AccountBroker,
        AccountCurrency,
        AccountType,
        AccountStrategy
      ]) => ({
        brokerId: broker.brokerId,
        currencyId: currency.currencyId,
        portfolioId: portfolio.portfolioId,
        instrumentType: type.id,
        strategyId: strategy.id,
      })
    )
  );
  inputStream$: Observable<Params> = this.#inputParams$.asObservable();

  limit$: Observable<number> = this.controlLimit.valueChanges.pipe(
    startWith(this.controlLimit.value),
    filter((limit: number | null): limit is number => limit !== null)
  );

  length$: Observable<{ total: number }> = this._service.total$.pipe(
    filter((value: { total: number } | null): value is { total: number } => value !== null),
    switchMap((data: { total: number }) =>
      combineLatest([this.limit$, this.index$.asObservable()]).pipe(
        map(([limit, index]: [number, number]) => {
          const length = Math.ceil(data.total / limit);

          if (length < index) {
            this.index$.next(0);
          }

          return { total: length };
        })
      )
    ),
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  @Input() set params(value: string | null) {
    this.#inputParams$.next({ query: value });
  }

  ngOnInit(): void {
    combineLatest([
      merge(
        this.inputStream$.pipe(
          tap((_) => this.isLoad$.next(true)),
          debounceTime(500)
        ),
        this.storeStream$
      ),
      this.range$,
      this.index$.asObservable(),
      this.limit$,
    ])
      .pipe(takeUntilDestroyed(this._destroyRef), debounceTime(500))
      .subscribe(([params, range, index, limit]: [any, any, number, number]) => {
        if (this.isData !== null) {
          this.isLoad$.next(true);
        }

        this._service.load({
          ...params,
          from: range.from,
          to: range.to,
          limit: limit,
          page: index + 1,
        });
      });

    combineLatest([
      this.data$.pipe(filter((list: PortfolioPosition[] | null): list is PortfolioPosition[] => list !== null)),
      this.activeIdeaId$,
    ])
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        take(1),
        map(([list, id]: [PortfolioPosition[], StockId | null]) => ({ id, list }))
      )
      .subscribe(({ id, list }: { id: StockId | null; list: PortfolioPosition[] }) => {
        if (this._queryParams.value()['type'] !== EventSelected.TRANSACTION) {
          if (id !== null) {
            this._queryParams.update({
              type: EventSelected.TRANSACTION,
              id,
            });
            return;
          }

          if (list[0]) {
            this._queryParams.update({
              type: EventSelected.TRANSACTION,
              id: list[0].ideaId,
            });
            return;
          }
        }

        this._queryParams.update({
          type: EventSelected.STOCK_LIST,
          id: '72187db2-44d8-4b2e-8b43-c41fd30c4a39',
        });
      });
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackById(_: number, item: PortfolioPosition): StockId {
    return item.ideaId;
  }

  onClick(event: Event, item: PortfolioPosition): void {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.TRANSACTION,
      id: item.ideaId,
    });
  }

  onDblclick(event: Event, item: PortfolioPosition) {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.TRANSACTION,
      id: item.ideaId,
      dialog: 'visible',
    });
  }

  goToPage(index: number): void {
    this.index$.next(index);
  }
}
