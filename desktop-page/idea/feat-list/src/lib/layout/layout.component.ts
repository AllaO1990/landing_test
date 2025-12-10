import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  InputSignal,
  signal,
  WritableSignal,
} from '@angular/core';
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { IDEA_CONSTANTS } from '@data-access-idea/constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterIdeaListComponent } from '../filter/filter.component';
import { debounceTime, Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockInstrument } from 'types/stock';
import { EventSelected } from 'types/events';
import { TuiButton, TuiFormatNumberPipe, TuiHint, TuiPopup, TuiTextfield } from '@taiga-ui/core';
import { TuiDrawer, TuiSkeleton } from '@taiga-ui/kit';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { UiList, UiListItem } from '@ui/components/list';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataAccessIdeaState } from '@data-access-idea/store';
import { LoaderComponent } from '@ui/components/loader';
import { ResponsePosition } from 'types/position';
import { GetColorToPositionPipe } from '@ui/pipes/get-color-to-position.pipe';
import { Params } from '@angular/router';
import { DataAccessIdeaService } from '@data-access-idea/data-access.service';

interface FilterValue {
  type: AccountType;
  strategy: AccountStrategy;
  currency: AccountCurrency;
}

@Component({
  selector: 'idea-layout',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiHint,
    TuiDrawer,
    TuiPopup,
    SearchDialogDirective,
    FilterIdeaListComponent,
    TuiTextfield,
    AsyncPipe,
    UiList,
    UiListItem,
    WithPaginationComponent,
    TuiSkeleton,
    LoaderComponent,
    DatePipe,
    NgTemplateOutlet,
    TuiFormatNumberPipe,
    GetColorToPositionPipe,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit {
  readonly #dataAccess: DataAccessIdeaService = inject(DataAccessIdeaService);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #valueDefault = {
    type: FilterIdeaListComponent.valueDefaultType,
    strategy: FilterIdeaListComponent.valueDefaultStrategy,
    currency: FilterIdeaListComponent.valueDefaultCurrency,
  };

  protected readonly size = 's';
  protected readonly listPagination = [10, 50, 100];
  protected readonly constants = IDEA_CONSTANTS;
  protected readonly filterControl: FormControl = new FormControl(this.#valueDefault);
  protected readonly searchControl: FormControl<string | null> = new FormControl('', { nonNullable: true });
  protected readonly paginationControl: FormControl = new FormControl({
    limit: this.listPagination[1],
    page: 0,
  });
  protected readonly openFilter: WritableSignal<boolean> = signal(false);

  readonly isActiveFilter$: Observable<boolean> = this.filterControl.valueChanges.pipe(
    startWith(this.filterControl.value),
    map(
      (value: FilterValue) =>
        value.currency.currencyId !== FilterIdeaListComponent.valueDefaultCurrency.currencyId ||
        value.strategy.id !== FilterIdeaListComponent.valueDefaultStrategy.id ||
        value.type.id !== FilterIdeaListComponent.valueDefaultType.id
    )
  );

  // @Output() submitted = new EventEmitter<{
  //   search: string;
  //   type: AccountType;
  //   strategy: AccountStrategy;
  //   currency: AccountCurrency;
  //   limit: number;
  //   page: number;
  // }>();

  readonly data: InputSignal<DataAccessIdeaState> = input.required();
  readonly isLoaded = computed(() => !this.data().isLoaded);
  readonly isLoading = computed(() => this.data().isLoaded && !this.data().isLoading);
  readonly list = computed(() => {
    const data = this.data().data;

    return data ? data.items : [];
  });
  readonly total = computed(() => {
    const data = this.data().data;

    return data ? data.total : 0;
  });

  ngAfterViewInit(): void {
    this.paginationControl.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(({ limit, page }: Params) =>
        this.#dataAccess.params.update((params: Params | null) => ({ ...params, limit, page: page + 1 }))
      );

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(250))
      .subscribe((value: string | null) => {
        this.#dataAccess.params.update((params: Params | null) => ({ ...params, query: value }));
      });
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);
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

  onReset(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);
    this.filterControl.reset(this.#valueDefault);

    this.#dataAccess.params.update((params: Params | null) => ({
      ...params,
      currencyId: this.#valueDefault.currency.currencyId,
      instrumentType: this.#valueDefault.type.id,
      strategyId: this.#valueDefault.strategy.id,
    }));
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);

    const { type, strategy, currency } = this.filterControl.value;
    this.#dataAccess.params.update((params: Params | null) => ({
      ...params,
      currencyId: currency.currencyId,
      instrumentType: type.id,
      strategyId: strategy.id,
    }));
  }

  onTrade(event: Event, item: ResponsePosition): void {
    event.preventDefault();

    this.#queryParams.update({
      trade: 'visible',
      type: 'position',
      id: item.id,
    });
  }
}
