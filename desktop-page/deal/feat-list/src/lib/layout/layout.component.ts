import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  inject,
  input,
  InputSignal,
  Output,
  signal,
  WritableSignal,
} from '@angular/core';
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterDealListComponent } from '../filter/filter.component';
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
import { DatePassedPipe } from '../../../../../main/src/lib/main/common/pipe/date-passed.pipe';
import { ColorPriceDirective } from '@ui/components/price';
import { ResponsePosition } from 'types/position';
import { DataAccessDealState } from '@data-access-deal/store';
import { DEAL_CONSTANTS } from '@data-access-deal/constants';

interface FilterValue {
  type: AccountType;
  strategy: AccountStrategy;
  currency: AccountCurrency;
}

@Component({
  selector: 'deal-layout',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiHint,
    TuiDrawer,
    TuiPopup,
    SearchDialogDirective,
    FilterDealListComponent,
    TuiTextfield,
    AsyncPipe,
    UiList,
    UiListItem,
    WithPaginationComponent,
    TuiSkeleton,
    DatePassedPipe,
    DatePipe,
    NgTemplateOutlet,
    TuiFormatNumberPipe,
    ColorPriceDirective,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #valueDefault = {
    search: '',
    type: FilterDealListComponent.valueDefaultType,
    strategy: FilterDealListComponent.valueDefaultStrategy,
    currency: FilterDealListComponent.valueDefaultCurrency,
  };

  protected readonly size = 's';
  protected readonly listPagination = [10, 50, 100];
  protected readonly constants = DEAL_CONSTANTS;
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
        value.currency.currencyId !== FilterDealListComponent.valueDefaultCurrency.currencyId ||
        value.strategy.id !== FilterDealListComponent.valueDefaultStrategy.id ||
        value.type.id !== FilterDealListComponent.valueDefaultType.id
    )
  );

  @Output() submitted = new EventEmitter<{
    search: string;
    type: AccountType;
    strategy: AccountStrategy;
    currency: AccountCurrency;
    limit: number;
    page: number;
  }>();

  readonly data: InputSignal<DataAccessDealState> = input.required();
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
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(150))
      .subscribe((value) =>
        this.submitted.emit({
          ...this.filterControl.value,
          ...value,
        })
      );
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

    this.filterControl.reset(this.#valueDefault);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);
    this.submitted.emit(this.filterControl.value);
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
