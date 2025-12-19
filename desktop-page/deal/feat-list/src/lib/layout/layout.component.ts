import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  InputSignal,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterDealListComponent } from '../filter/filter.component';
import { debounceTime, distinctUntilChanged, Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockInstrument } from 'types/stock';
import { EventSelected } from 'types/events';
import {
  TuiButton,
  TuiFormatNumberPipe,
  TuiHint,
  tuiNumberFormatProvider,
  TuiPopup,
  TuiTextfield,
} from '@taiga-ui/core';
import { TuiBadgedContent, TuiBadgeNotification, TuiDrawer, TuiSkeleton } from '@taiga-ui/kit';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { UiList, UiListItem } from '@ui/components/list';
import { AccountBroker, AccountDealType, AccountStrategy, AccountType } from 'types/account';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ColorPriceDirective } from '@ui/components/price';
import { Position, ResponsePosition } from 'types/position';
import { DataAccessDealState } from '@data-access-deal/store';
import { DEAL_CONSTANTS } from '@data-access-deal/constants';
import { GetDatePassedPipe } from '@ui/pipes/get-date-passed.pipe';
import { DataAccessDealService } from '@data-access-deal/data-access.service';
import { Params } from '@angular/router';
import { PortfolioPosition } from 'types/portfolio';
import { LoaderComponent } from '@ui/components/loader';

interface FilterValue {
  type: AccountType;
  strategy: AccountStrategy;
  dealType: AccountDealType;
  broker: AccountBroker;
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
    GetDatePassedPipe,
    DatePipe,
    NgTemplateOutlet,
    TuiFormatNumberPipe,
    ColorPriceDirective,
    TuiBadgeNotification,
    TuiBadgedContent,
    LoaderComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  providers: [tuiNumberFormatProvider({ precision: 2, decimalMode: 'always' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #dataAccess: DataAccessDealService = inject(DataAccessDealService);
  readonly #valueDefault = {
    dealType: FilterDealListComponent.valueDefaultDealType,
    type: FilterDealListComponent.valueDefaultType,
    strategy: FilterDealListComponent.valueDefaultStrategy,
    broker: FilterDealListComponent.valueDefaultBroker,
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
        value.dealType.id !== null ||
        value.strategy.id !== null ||
        value.type.id !== null ||
        value.broker.brokerId !== null
    ),
    distinctUntilChanged()
  );

  readonly data: InputSignal<DataAccessDealState> = input.required();
  readonly isLoaded = computed(() => !this.data().isLoaded);
  readonly isLoading = computed(() => this.data().isLoaded && !this.data().isLoading);
  readonly list: Signal<PortfolioPosition[]> = computed(() => {
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
      .subscribe((value: Params) =>
        this.#dataAccess.params.update((params: Params | null) => ({ ...params, ...value, ...this._getParams() }))
      );

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(250))
      .subscribe((value: string | null) =>
        this.#dataAccess.params.update((params: Params | null) => ({
          ...params,
          query: value,
        }))
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

    this.openFilter.set(false);
    this.filterControl.reset(this.#valueDefault);
    this.#dataAccess.params.update((params: Params | null) => ({ ...params, ...this._getParams() }));
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);
    this.#dataAccess.params.update((params: Params | null) => ({ ...params, ...this._getParams() }));
  }

  onTrade(event: Event, item: ResponsePosition): void {
    event.preventDefault();

    this.#queryParams.update({
      trade: 'visible',
      type: 'transaction',
      id: item.id || (item as any).ideaId,
    });
  }

  public onDblclick(event: Event, item: Position): void {
    event.preventDefault();

    console.log(item);

    this.#queryParams.update({
      type: EventSelected.IDEA,
      id: item.id,
      dialog: 'visible',
    });
  }

  private _getParams(): Params {
    const { dealType, type, strategy, broker } = this.filterControl.value;

    return {
      brokerId: broker.brokerId,
      dealType: dealType.id,
      instrumentType: type.id,
      strategyId: strategy.id,
    };
  }
}
