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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ENTRY_CONSTANTS } from './entry.constants';
import { EntryEnums } from './entry.enums';
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
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { StockInstrument } from 'types/stock';
import { AccountFacade } from 'stores/facades/account.facade';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Position, Positions } from 'types/position';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { MainService } from '../main.service';
import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiButton, TuiHint, TuiPopup, TuiScrollbar, TuiTextfield } from '@taiga-ui/core';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { TuiInputModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';
import { EntryTableComponent } from './table/table.component';
import { TuiDrawer } from '@taiga-ui/kit';

const TIMER_INTERVAL = 60 * 1000;

interface PaginationValue {
  limit: number;
  page: number;
}

interface FilterValue {
  type: any;
  strategy: any;
  currency: any;
  query: any;
}

@Component({
  selector: 'main-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TuiButton,
    SearchDialogDirective,
    TuiTextfield,
    TuiSelectModule,
    NgIf,
    TuiTextfieldControllerModule,
    WithPaginationComponent,
    EntryTableComponent,
    TuiInputModule,
    TuiDrawer,
    TuiPopup,
    NgTemplateOutlet,
    TuiScrollbar,
    TuiHint,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComponent implements AfterViewInit {
  readonly #service: MainService = inject(MainService);
  readonly #idea: IdeaFacade = inject(IdeaFacade);
  readonly #accountFacade: AccountFacade = inject(AccountFacade);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly #valueDefaultCurrency = { currency: null, currencySymbol: 'Все', currencyId: null };
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

  readonly data$: Observable<Positions | null> = this.#idea.ideas$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
  readonly list$: Observable<Position[] | null> = this.data$.pipe(
    map((data: Positions | null) => data && data.items),
    map((data: Position[] | null) => data && this.#service.sortIdeaList(data))
  );
  readonly total$: Observable<number | null> = this.data$.pipe(
    map((data: Positions | null) => (data !== null ? data.total : null))
  );

  readonly formGroup: FormGroup = new FormGroup({
    type: new FormControl(this.#valueDefaultType),
    strategy: new FormControl(this.#valueDefaultStrategy),
    currency: new FormControl(this.#valueDefaultCurrency),
  });

  readonly isActiveFilter$: Observable<boolean> = this.formGroup.valueChanges.pipe(
    startWith(this.formGroup.value),
    map(
      (value: FilterValue) =>
        value.currency.currencyId !== this.#valueDefaultCurrency.currencyId ||
        value.strategy.id !== this.#valueDefaultStrategy.id ||
        value.type.id !== this.#valueDefaultType.id
    )
  );

  readonly listPagination = [10, 50, 100];
  readonly controlPaginationIdea: FormControl<PaginationValue | null> = new FormControl({
    limit: this.listPagination[2],
    page: 0,
  });
  protected readonly openFilter: WritableSignal<boolean> = signal(false);

  readonly controlSearch: FormControl<string | null> = new FormControl('', { nonNullable: true });
  readonly controlFilterSearch: FormControl<string | null> = new FormControl('', { nonNullable: true });

  readonly constants: { [key in EntryEnums]: string } = ENTRY_CONSTANTS;
  readonly size = 's';

  readonly #params$: Subject<any> = new BehaviorSubject(this.formGroup.value);
  templateValue = this.formGroup.value;

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
          strategyId: value.strategy.id,
          limit: pagination.limit,
          page: pagination.page + 1,
          query: value.query,
        })),
        debounceTime(0)
      )
      .subscribe((res) => {
        this.#idea.loadIdeas(res);
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
