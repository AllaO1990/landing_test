import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiAutoFocus, TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiBreakpointService, TuiButton, TuiGroup } from '@taiga-ui/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  shareReplay,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { StockInstrument, StockListItems } from 'types/stock';
import { map, tap } from 'rxjs/operators';
import { AsyncPipe, NgIf } from '@angular/common';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { IconTickerComponent } from '@ui/components/icon-ticker';
import { StockSearchInstrumentsStore } from 'stores/plugins/stock-search-instruments.store';
import { DesktopService } from '@desktop-data/desktop-data';
import { DESKTOP_API } from 'tokens/desktop';
import { TuiPagination } from '@taiga-ui/kit';
import { LoaderComponent } from '@ui/components/loader';

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
    LoaderComponent,
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
  private readonly _store: StockSearchInstrumentsStore = inject(StockSearchInstrumentsStore);

  public readonly _breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);

  readonly isLoad$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  readonly isSearch$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);
  readonly size = 's';

  readonly form: FormGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  readonly isMobile$: Observable<boolean> = this._breakpoint$.pipe(
    map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile')
  );

  get controlSearch(): FormControl {
    return this.form.get('search') as FormControl;
  }

  readonly #type$: Observable<'search' | 'default'> = combineLatest([
    this.isSearch$.asObservable(),
    this.controlSearch.valueChanges.pipe(startWith(this.controlSearch.value)),
  ]).pipe(
    map(([isSearch, search]: [boolean, string | null]) => {
      if (isSearch) {
        return search === null || search.length === 0 ? 'default' : 'search';
      }

      return 'default';
    }),
    distinctUntilChanged()
  );

  readonly list$: Observable<StockListItems | null> = this.#type$.pipe(
    tap((type: 'search' | 'default') => type === 'default' && this.isSearch$.next(false)),
    switchMap((type: 'search' | 'default') => (type === 'default' ? this._store.list$ : this._store.searchList$)),
    tap(() => this.isLoad$.next(false)),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  readonly length$: Observable<number | null> = this._store.total$.pipe(
    switchMap((total: null | number) =>
      this.#type$.pipe(map((type: 'search' | 'default') => (type === 'default' ? total : null)))
    ),
    map((total: null | number) => total && Math.ceil(total / this.#limit))
  );

  readonly isEmpty$: Observable<boolean> = this.list$.pipe(
    map((list: StockListItems | null) => {
      if (list === null) {
        return false;
      }

      return list.length === 0;
    })
  );

  index = 0;

  ngAfterViewInit(): void {
    this._loadInstruments(1);
    this.isLoad$.next(true);
  }

  private _loadInstruments = this._store.loadWithLimitListInstrument(this.#limit);

  goToPage(index: number): void {
    this.index = index;
    this._loadInstruments(index + 1);
  }

  onSearch(event: Event): void {
    event.preventDefault();

    this.isSearch$.next(true);
    this._store.searchListInstrument(this.controlSearch.value);
  }

  onClick(event: Event, value: StockInstrument): void {
    event.preventDefault();

    this.context.completeWith(value);
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.completeWith(null);
  }
}
