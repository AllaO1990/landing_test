import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { OUT_CONSTANTS } from './out.constants';
import { OutEnums } from './out.enums';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Position, Positions } from 'types/position';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  Observable,
  shareReplay,
  startWith,
  Subject,
  timer,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { OutTableComponent } from './table/table.component';
import { TuiDataListWrapperComponent, TuiDrawer } from '@taiga-ui/kit';
import { TuiInputModule, TuiMultiSelectModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiButton, TuiHint, TuiPopup, TuiScrollbar, TuiTextfield, TuiTextfieldComponent } from '@taiga-ui/core';
import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { AccountBroker, AccountCurrency, AccountPortfolio, AccountStrategy, AccountType } from 'types/account';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { StockInstrument } from 'types/stock';
import { AccountFacade } from 'stores/facades/account.facade';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface PaginationValue {
  limit: number;
  page: number;
}

interface FilterValue {
  type: any;
  strategy: any;
  currency: any;
  broker: any;
  portfolio: any;
  query: any;
}

const TIMER_INTERVAL = 60 * 1000;

@Component({
  selector: 'vt-out',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    OutTableComponent,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiButton,
    AsyncPipe,
    TuiDataListWrapperComponent,
    TuiMultiSelectModule,
    SearchDialogDirective,
    TuiDrawer,
    TuiTextfieldComponent,
    TuiTextfield,
    NgTemplateOutlet,
    TuiPopup,
    TuiHint,
    NgIf,
    TuiScrollbar,
    TuiSelectModule,
    WithPaginationComponent,
  ],
  templateUrl: './out.component.html',
  styleUrls: ['./out.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutComponent implements AfterViewInit {
  readonly #accountFacade: AccountFacade = inject(AccountFacade);
  readonly #idea: IdeaFacade = inject(IdeaFacade);

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  public readonly constants: { [key in OutEnums]: string } = OUT_CONSTANTS;

  readonly #valueDefaultCurrency = { currency: null, currencySymbol: 'Все', currencyId: null };
  readonly #valueDefaultBroker = { broker: 'Все', brokerId: null };
  readonly #valueDefaultPortfolio = { portfolio: 'Все', portfolioId: null };
  readonly #valueDefaultStrategy = { name: 'Все', key: 'all', id: null };
  readonly #valueDefaultType = { name: 'Все', key: 'all', id: null };

  readonly strategy$: Observable<AccountStrategy[]> = this.#accountFacade.strategies$.pipe(
    filter((list: AccountStrategy[] | null): list is AccountStrategy[] => list !== null),
    map((list: AccountStrategy[]) => [this.#valueDefaultStrategy, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly types$: Observable<AccountType[]> = this.#accountFacade.types$.pipe(
    filter((list: AccountType[] | null): list is AccountType[] => list !== null),
    map((list: AccountType[]) => [this.#valueDefaultType, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly currency$: Observable<AccountCurrency[] | null> = this.#accountFacade.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [this.#valueDefaultCurrency, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly brokers$: Observable<null | AccountBroker[]> = this.#accountFacade.brokers$.pipe(
    filter((list: null | AccountBroker[]): list is AccountBroker[] => list !== null),
    map((list: AccountBroker[]) => [this.#valueDefaultBroker, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly portfolios$: Observable<null | AccountPortfolio[]> = this.#accountFacade.portfolios$.pipe(
    filter((list: null | AccountPortfolio[]): list is AccountPortfolio[] => list !== null),
    map((list: AccountPortfolio[]) => [this.#valueDefaultPortfolio, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly formGroup: FormGroup = new FormGroup({
    type: new FormControl(this.#valueDefaultType),
    strategy: new FormControl(this.#valueDefaultStrategy),
    currency: new FormControl(this.#valueDefaultCurrency),
    broker: new FormControl(this.#valueDefaultBroker),
    portfolio: new FormControl(this.#valueDefaultPortfolio),
  });

  readonly openFilter: WritableSignal<boolean> = signal(false);
  readonly listPagination = [10, 50, 100];
  readonly controlPaginationIdea: FormControl<PaginationValue | null> = new FormControl({
    limit: this.listPagination[2],
    page: 0,
  });

  readonly data$: Observable<Positions | null> = this.#idea.positions$.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly list$: Observable<Position[] | null> = this.data$.pipe(map((data: Positions | null) => data && data.items));
  readonly total$: Observable<number | null> = this.data$.pipe(
    map((data: Positions | null) => (data !== null ? data.total : null))
  );

  readonly #params$: Subject<any> = new BehaviorSubject(this.formGroup.value);
  templateValue = this.formGroup.value;

  readonly controlSearch: FormControl<string | null> = new FormControl('', { nonNullable: true });
  readonly controlFilterSearch: FormControl<string | null> = new FormControl('', { nonNullable: true });

  readonly size = 's';
  readonly isActiveFilter$: Observable<boolean> = this.formGroup.valueChanges.pipe(
    startWith(this.formGroup.value),
    map(
      (value: FilterValue) =>
        value.currency.currencyId !== this.#valueDefaultCurrency.currencyId ||
        value.strategy.id !== this.#valueDefaultStrategy.id ||
        value.type.id !== this.#valueDefaultType.id ||
        value.broker.brokerId !== this.#valueDefaultBroker.brokerId ||
        value.portfolio.portfolioId !== this.#valueDefaultPortfolio.portfolioId
    )
  );

  constructor() {
    effect(() => {
      if (this.openFilter()) {
        this.templateValue = this.formGroup.value;
      }
    });
  }

  ngAfterViewInit(): void {
    this.controlSearch.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(500))
      .subscribe((value: string | null) => {
        this.controlFilterSearch.patchValue(value, { emitEvent: false });

        this.#params$.next({
          ...this.formGroup.value,
          query: value,
        });
      });

    combineLatest([
      timer(0, TIMER_INTERVAL),
      this.#params$.asObservable(),
      this.controlPaginationIdea.valueChanges.pipe(
        startWith(this.controlPaginationIdea.value),
        filter((value: PaginationValue | null): value is PaginationValue => value !== null)
      ),
    ])
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        map(([_, value, pagination]: [number, FilterValue, PaginationValue]) => ({
          currencyId: value.currency.currencyId,
          instrumentType: value.type.id,
          brokerId: value.broker.brokerId,
          strategyId: value.strategy.id,
          portfolioId: value.portfolio.portfolioId,
          limit: pagination.limit,
          page: pagination.page + 1,
          query: value.query,
        })),
        debounceTime(0)
      )
      .subscribe((value) => {
        this.#idea.loadPositions(value);
      });
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);
    this.formGroup.patchValue(this.templateValue);
  }

  onReset(event: Event): void {
    event.preventDefault();

    this.formGroup.patchValue({
      type: this.#valueDefaultType,
      strategy: this.#valueDefaultStrategy,
      currency: this.#valueDefaultCurrency,
      broker: this.#valueDefaultBroker,
      portfolio: this.#valueDefaultPortfolio,
    });

    this.controlFilterSearch.patchValue('');
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);
    this.#params$.next({
      ...this.formGroup.value,
      query: this.controlFilterSearch.value,
    });

    this.controlSearch.patchValue(this.controlFilterSearch.value, { emitEvent: false });
  }

  onOpenDialog(event: StockInstrument | null): void {
    if (event) {
      this.#queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: event.id,
        dialog: 'visible',
      });
    }
  }
}
