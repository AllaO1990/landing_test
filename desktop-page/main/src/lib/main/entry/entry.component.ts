import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ENTRY_CONSTANTS } from './entry.constants';
import { EntryEnums } from './entry.enums';
import { combineLatest, debounceTime, filter, Observable, shareReplay, startWith, timer } from 'rxjs';
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

const TIMER_INTERVAL = 60 * 1000;

@Component({
  selector: 'vt-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComponent implements AfterViewInit {
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
  readonly list$: Observable<Position[] | null> = this.data$.pipe(map((data: Positions | null) => data && data.items));
  readonly total$: Observable<number | null> = this.data$.pipe(map((data: Positions | null) => data && data.total));

  readonly formGroup: FormGroup = new FormGroup({
    type: new FormControl(this.#valueDefaultType),
    strategy: new FormControl(this.#valueDefaultStrategy),
    currency: new FormControl(this.#valueDefaultCurrency),
  });

  readonly controlPaginationIdea: FormControl = new FormControl(null);
  readonly controlSearch: FormControl<string> = new FormControl('', { nonNullable: true });
  public openMore = false;
  public constants: { [key in EntryEnums]: string } = ENTRY_CONSTANTS;
  readonly listPagination = [10, 50, 100];
  // public filterStock: StockInstrumentWithMap[] = this._updateFilterList(
  //   MAIN_FILTER_STOCK,
  //   null,
  //   this.instrumentType,
  //   this.mainFilterId
  // );
  // public filterStrategy: AccountStrategiesWithMap[] = this._updateFilterList(
  //   STOCK_STRATEGY_LIST,
  //   null,
  //   this.strategyType,
  //   this.stockStrategyKey
  // );
  readonly size = 's';

  // public readonly data$: Observable<Position[] | null> = this._data$.asObservable().pipe(
  //   map((list: Position[] | null) => list && list.sort((a, b) => (a.priceToTarget || 0) - (b.priceToTarget || 0))),
  //   switchMap((data: Position[] | null) =>
  //     combineLatest([
  //       this.controlSearch.valueChanges.pipe(
  //         map((value: string) => value.trim().toLowerCase()),
  //         startWith(this.controlSearch.value)
  //       ),
  //       this.controlFilterStock.valueChanges.pipe(startWith(this.controlFilterStock.value)),
  //       this.controlFilterStrategy.valueChanges.pipe(startWith(this.controlFilterStrategy.value)),
  //     ]).pipe(
  //       map(([search, stock, strategy]: [string, StockInstrumentWithMap[], AccountStrategiesWithMap[]]) =>
  //         this._filterData(searchPosition(data, search), stock, strategy)
  //       )
  //     )
  //   )
  // );

  // readonly stringify: TuiStringHandler<StockInstrumentWithMap | TuiContext<StockInstrumentWithMap>> = (item) =>
  //   'name' in item ? item.name : item.$implicit.name;
  //
  // readonly identityMatcher: TuiIdentityMatcher<StockInstrumentWithMap> = (a, b) => a.id === b.id;
  //
  // disabledItemHandler: TuiBooleanHandler<{ disabled: boolean }> = (item: { disabled: boolean }) => item.disabled;

  // @Input()
  // set data(value: Position[] | null) {
  //   this.filterStock = this._updateFilterList(MAIN_FILTER_STOCK, value, this.instrumentType, this.mainFilterId);
  //   this.filterStrategy = this._updateFilterList(STOCK_STRATEGY_LIST, value, this.strategyType, this.stockStrategyKey);
  //
  //   this._data$.next(value);
  // }

  ngAfterViewInit(): void {
    combineLatest([
      timer(0, TIMER_INTERVAL),
      this.formGroup.valueChanges.pipe(startWith(this.formGroup.value)),
      this.controlPaginationIdea.valueChanges.pipe(startWith(this.controlPaginationIdea.value)),
    ])
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        map(([_, value, pagination]: [number, any, any]) => ({
          currencyId: value.currency.currencyId,
          instrumentType: value.type.id,
          strategyId: value.strategy.id,
          limit: pagination.limit,
          page: pagination.page + 1,
        })),
        debounceTime(0)
      )
      .subscribe((res) => {
        console.log(res);

        this.#idea.loadIdeas(res);
      });
  }

  // private _updateFilterList<T>(
  //   list: any[],
  //   data: Position[] | null,
  //   fnType: (d: Position) => string,
  //   fnKey: (d: T) => string
  // ): T[] {
  //   const types: string[] = [...new Set((data || []).map((item: Position) => fnType(item)))];
  //
  //   return list.map((item: T) => {
  //     const map: string[] = types.filter((type: string) => type.indexOf(fnKey(item)) !== -1);
  //
  //     return {
  //       ...item,
  //       map: [...map, fnKey(item)],
  //       disabled: !map.length,
  //     };
  //   });
  // }

  // private _filterData(
  //   data: Position[] | null,
  //   valueStock: StockInstrumentWithMap[],
  //   valueStrategy: AccountStrategiesWithMap[]
  // ): Position[] | null {
  //   if (data === null) {
  //     return data;
  //   }
  //   const mapStock = this._getObject(valueStock);
  //   const mapStrategy = this._getObject(valueStrategy);
  //
  //   return data.filter((item: Position) => {
  //     return (
  //       (!valueStock.length || mapStock[item.instrument.type]) &&
  //       (!valueStrategy.length || mapStrategy[item.strategy.type])
  //     );
  //   });
  // }

  // private _getObject(list: { map: string[] }[]): { [key: string]: boolean } {
  //   return list.reduce(
  //     (acc: { [key: string]: boolean }, item: { map: string[] }) => ({
  //       ...acc,
  //       ...item.map.reduce((common, uid: string) => ({ ...common, [uid]: true }), {}),
  //     }),
  //     {}
  //   );
  // }

  public onOpenMore(): void {
    this.openMore = !this.openMore;
  }

  public onObscuredMore(obscured: boolean): void {
    if (obscured) {
      this.openMore = false;
    }
  }

  public onActiveZoneMore(active: boolean): void {
    this.openMore = active && this.openMore;
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
