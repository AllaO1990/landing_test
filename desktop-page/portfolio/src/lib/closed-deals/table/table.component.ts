import { TuiTable } from '@taiga-ui/addon-table';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { WRAPPER_TABLE_HEADER } from './table.constants';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { TuiFormatNumberPipe, TuiHint, TuiIcon, TuiScrollable, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { StockId, StockTransaction } from 'types/stock';
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
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { GetBrokerPipe } from '@ui/pipes/get-broker.pipe';
import { Params } from '@angular/router';

@Component({
  selector: 'lib-wrapper-table',
  standalone: true,
  imports: [
    TuiTable,
    NgForOf,
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
  readonly controlLimit: FormControl = new FormControl<number>(100);
  readonly header = WRAPPER_TABLE_HEADER;

  isData: boolean | null = null;

  public activeIdeaId$: Observable<StockId | null> = this._service.select$.pipe(
    map((result: StockTransaction | null) => (result ? result.ideaId : null)),
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  index$: Subject<number> = new BehaviorSubject(0);
  isLoad$: Subject<boolean> = new BehaviorSubject(false);

  data$: Observable<PortfolioPosition[] | null> = this._service.list$.pipe(
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
  currency$: Observable<AccountCurrency> = this._service.currency$.pipe(
    filter((list: null | AccountCurrency): list is AccountCurrency => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  range$: Observable<any> = this._service.range$.pipe(
    filter((list: null | any): list is any => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  storeStream$: Observable<Params> = combineLatest([this.portfolio$, this.broker$, this.currency$]).pipe(
    map(([portfolio, broker, currency]: [AccountPortfolio, AccountBroker, AccountCurrency]) => ({
      brokerId: broker.brokerId,
      currencyId: currency.currencyId,
      portfolioId: portfolio.portfolioId,
    }))
  );
  inputStream$: Observable<Params> = this.#inputParams$.asObservable();

  limit$: Observable<number> = this.controlLimit.valueChanges.pipe(
    startWith(this.controlLimit.value),
    filter((limit: number | null): limit is number => limit !== null)
  );

  length$: Observable<number> = this._service.total$.pipe(
    filter((value: number | null): value is number => value !== null),
    switchMap((total: number) =>
      combineLatest([this.limit$, this.index$.asObservable()]).pipe(
        map(([limit, index]: [number, number]) => {
          const length = Math.ceil(total / limit);

          if (length < index) {
            this.index$.next(0);
          }

          return length;
        })
      )
    ),
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  @Input() set params(value: Params) {
    console.log(value);
    if (value) {
      const { portfolio, broker, currency } = value;

      this.#inputParams$.next({
        brokerId: broker && broker.brokerId,
        currencyId: currency && currency.currencyId,
        portfolioId: portfolio && portfolio.portfolioId,
      });
    }
  }

  ngOnInit(): void {
    // const today = new Date().setUTCHours(12, 0, 0, 0);
    // const start = new Date(new Date(today).setDate(-365 + new Date(today).getDate())).toISOString();
    // const end = new Date(today).toISOString();

    // combineLatest([this.portfolio$, this.broker$, this.currency$, this.range$, this.index$.asObservable(), this.limit$])
    combineLatest([merge(this.inputStream$, this.storeStream$), this.range$, this.index$.asObservable(), this.limit$])
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
          }
        }
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
