import { TuiInputModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { TuiAutoFocus, TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiBreakpointService, TuiButton, TuiGroup } from '@taiga-ui/core';
import {
  BehaviorSubject,
  combineLatest,
  debounce,
  debounceTime,
  distinctUntilChanged,
  MonoTypeOperatorFunction,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  timer,
} from 'rxjs';
import { Stock, StockInstrument } from 'types/stock';
import { map, tap } from 'rxjs/operators';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { IconTickerComponent } from '@ui/components/icon-ticker';
import { StockSearchInstrumentsStore } from 'stores/plugins/stock-search-instruments.store';
import { DesktopService } from '@desktop-data/desktop-data';
import { DESKTOP_API } from 'tokens/desktop';
import { TuiPagination } from '@taiga-ui/kit';
import { SearchDialogItemCondition, SearchDialogListLengthPipe } from './search-dialog.pipe';
import { LoaderComponent } from '@ui/components/loader';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActionComponent } from './action/action.component';

type FormSearchDialog = {
  search: string | null;
  subscription: { id: boolean | null };
  page: number;
};

const debounceTimeWithCondition =
  <T>(condition: (arg: T) => boolean, timeMs = 500): MonoTypeOperatorFunction<T> =>
  (source$: Observable<T>) =>
    source$.pipe(debounce((value: T) => (condition(value) ? timer(timeMs) : timer(0))));

@Component({
  selector: 'lib-dialog-search',
  standalone: true,
  imports: [
    TuiInputModule,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    AsyncPipe,
    ListComponent,
    ItemDirective,
    HeaderComponent,
    TuiAutoFocus,
    TuiButton,
    TuiGroup,
    IconTickerComponent,
    TuiPagination,
    NgIf,
    SearchDialogListLengthPipe,
    LoaderComponent,
    ActionComponent,
    SearchDialogItemCondition,
    NgForOf,
    TuiSelectModule,
  ],
  templateUrl: './search-dialog.component.html',
  styleUrl: './search-dialog.component.scss',
  providers: [
    {
      provide: StockSearchInstrumentsStore,
      useFactory: (api: DesktopService) => new StockSearchInstrumentsStore(api),
      deps: [DESKTOP_API],
    },
    SearchDialogItemCondition,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDialogComponent implements AfterViewInit {
  readonly #limit = 100;
  readonly #startPage = 0;
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  readonly #store: StockSearchInstrumentsStore = inject(StockSearchInstrumentsStore);
  readonly #itemCondition: SearchDialogItemCondition = inject(SearchDialogItemCondition);
  readonly #disabled$: Subject<boolean> = new BehaviorSubject<boolean>(true);

  public readonly _breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);

  readonly isLoad$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);
  readonly size = 's';

  readonly form: FormGroup = new FormGroup({
    subscription: new FormControl<{ id: boolean | null; text: string } | null>(null),
    page: new FormControl<number>(this.#startPage),
    type: new FormControl<string>('default'),
  });

  readonly controlSearch: FormControl = new FormControl<string | null>(null);

  readonly subscription$: Observable<{ id: boolean | null; text: string }[]> = of([
    { id: null, text: 'Все' },
    { id: true, text: 'В подписке' },
    { id: false, text: 'Без подписки' },
  ]).pipe(tap((list) => this.controlSubscription.patchValue(list[1])));

  readonly isMobile$: Observable<boolean> = this._breakpoint$.pipe(
    map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile')
  );

  get controlSubscription(): FormControl {
    return this.form.get('subscription') as FormControl;
  }

  get controlType(): FormControl {
    return this.form.get('type') as FormControl;
  }

  get controlPage(): FormControl {
    return this.form.get('page') as FormControl;
  }

  get index(): number {
    return this.controlPage.value;
  }

  readonly isDisabledSearch$: Observable<boolean> = this.#disabled$.asObservable().pipe(distinctUntilChanged());

  readonly list$: Observable<Stock | null> = this.controlSearch.valueChanges.pipe(
    startWith(this.controlSearch.value),
    distinctUntilChanged(),
    switchMap((value: string | null) => (!value ? this.#store.list$ : this.#store.searchList$)),
    map((data: Stock | null) => data && { ...data, items: data.items.slice() }),
    tap(() => this.isLoad$.next(false)),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  goToPage(index: number): void {
    this.form.patchValue({ page: index });
  }

  onSearch(event: Event): void {
    event.preventDefault();

    this.form.patchValue({ type: 'search', page: this.#startPage });
  }

  onClick(event: Event, item: StockInstrument): void {
    event.preventDefault();

    if (!this.#itemCondition.transform(item)) {
      this.context.completeWith(item);
    }
  }

  ngAfterViewInit(): void {
    combineLatest({
      search: this.controlSearch.valueChanges.pipe(
        tap((value: string | null) => {
          !!value && this.#store.resetSearchListInstrument();
          this.form.patchValue({ type: !value ? 'default' : 'search' });
          this.#disabled$.next(false);
        }),
        debounceTimeWithCondition((value: string | null) => !!value),
        tap(() => this.form.patchValue({ page: this.#startPage })),
        startWith(this.controlSearch.value)
      ),
      form: this.form.valueChanges.pipe(startWith(this.form.value)),
    })
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(0))
      .subscribe(({ search, form }) => {
        this.#disabled$.next(true);
        this.isLoad$.next(true);

        this._conditionLoad({ search, ...form });
      });
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.completeWith(null);
  }

  trackById(_: number, item: StockInstrument): string {
    return item.id;
  }

  onAction(instrument: StockInstrument): void {
    if (instrument.subscriptionStatus === 0) {
      this.#store.addSubscriptionStockListInstrument({
        instrumentId: instrument.id,
        type: this.controlType.value,
      });
    }
  }

  private _conditionLoad({ search, subscription, page }: FormSearchDialog): void {
    if (!search) {
      this.#store.loadListInstrument({
        sub: subscription.id,
        page: page + 1,
        limit: this.#limit,
      });
    } else {
      this.#store.searchListInstrument({
        query: search,
        sub: subscription.id,
        page: page + 1,
        limit: this.#limit,
      });
    }
  }
}
