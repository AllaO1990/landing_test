import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TuiAutoFocus, TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiBreakpointService, TuiButton, TuiGroup } from '@taiga-ui/core';
import { BehaviorSubject, distinctUntilChanged, Observable, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { Stock, StockInstrument } from 'types/stock';
import { filter, map, tap } from 'rxjs/operators';
import { AsyncPipe, NgIf } from '@angular/common';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { IconTickerComponent } from '@ui/components/icon-ticker';
import { StockSearchInstrumentsStore } from 'stores/plugins/stock-search-instruments.store';
import { DesktopService } from '@desktop-data/desktop-data';
import { DESKTOP_API } from 'tokens/desktop';
import { TuiPagination } from '@taiga-ui/kit';
import { SearchDialogListLengthPipe } from './search-dialog.pipe';
import { LoaderComponent } from '@ui/components/loader';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActionComponent } from './action/action.component';

type ActionForList = 'search' | 'default';

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
  ],
  templateUrl: './search-dialog.component.html',
  styleUrl: './search-dialog.component.scss',
  providers: [
    {
      provide: StockSearchInstrumentsStore,
      useFactory: (api: DesktopService) => new StockSearchInstrumentsStore(api),
      deps: [DESKTOP_API],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDialogComponent implements AfterViewInit {
  readonly #limit = 100;
  readonly #startPage = 0;
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _store: StockSearchInstrumentsStore = inject(StockSearchInstrumentsStore);

  public readonly _breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);

  readonly isLoad$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);
  readonly size = 's';

  readonly form: FormGroup = new FormGroup({
    search: new FormControl<string | null>(null),
    params: new FormControl<{ type: ActionForList; page: number }>({ type: 'default', page: this.#startPage }),
  });

  readonly isMobile$: Observable<boolean> = this._breakpoint$.pipe(
    map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile')
  );

  get controlSearch(): FormControl {
    return this.form.get('search') as FormControl;
  }

  get controlParams(): FormControl {
    return this.form.get('params') as FormControl;
  }

  get index(): number {
    return this.controlParams.value.page;
  }

  readonly isDisabledSearch$: Observable<boolean> = this.controlSearch.valueChanges.pipe(
    startWith(this.controlSearch.value),
    map((value: string | null) => value === null || value.length === 0),
    distinctUntilChanged()
  );

  readonly list$: Observable<Stock | null> = this.controlParams.valueChanges.pipe(
    map((value: { type: ActionForList; page: number }) => value.type),
    distinctUntilChanged(),
    switchMap((type: ActionForList) => (type === 'default' ? this._store.list$ : this._store.searchList$)),
    tap(() => this.isLoad$.next(false)),
    map(
      (list: Stock | null) =>
        list &&
        ({
          ...list,
          items: list?.items?.map((item) => ({ ...item, onAction: (item: any) => console.log(item) } as any)),
        } as Stock)
    ),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  ngAfterViewInit(): void {
    this.controlSearch.valueChanges
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.controlSearch.value),
        map((value: string | null) => value === null || value.length === 0),
        filter((condition: boolean) => condition)
      )
      .subscribe(() => this.controlParams.patchValue({ type: 'default', page: this.#startPage }));

    this.controlParams.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.controlParams.value))
      .subscribe(({ type, page }: { type: ActionForList; page: number }) => {
        this.isLoad$.next(true);

        this._conditionLoad(type, page + 1);
      });
  }

  goToPage(index: number): void {
    const { type } = this.controlParams.value;

    this.controlParams.patchValue({ type, page: index });
  }

  onSearch(event: Event): void {
    event.preventDefault();

    this.controlParams.patchValue({ type: 'search', page: this.#startPage });
  }

  onClick(event: Event, value: StockInstrument): void {
    event.preventDefault();

    if (value.inSub) {
      this.context.completeWith(value);
    }
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.completeWith(null);
  }

  trackById(_: number, item: StockInstrument): string {
    return item.id;
  }

  onAction(event: any): void {
    console.log(event);
  }

  onSubscribe(event: Event, item: StockInstrument): void {
    event.preventDefault();

    console.log(item);

    this._store.addSubscriptionStockListInstrument({ instrumentId: item.id });
  }

  private _conditionLoad(type: ActionForList, page = 1): void {
    if (type === 'default') {
      this._store.loadListInstrument({
        page,
        limit: this.#limit,
      });
    } else {
      this._store.searchListInstrument({
        query: this.controlSearch.value,
        page,
        limit: this.#limit,
      });
    }
  }
}
