import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ENTRY_CONSTANTS } from './entry.constants';
import { Idea } from 'types/idea';
import { EntryEnums } from './entry.enums';
import { MAIN_FILTER_STOCK } from '../main.constants';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { BehaviorSubject, combineLatest, Observable, startWith, Subject, switchMap } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { TuiBooleanHandler } from '@taiga-ui/cdk';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { SelectFacade } from 'stores/facades/select.facade';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StockInstrument } from 'types/stock';

interface FilterListItem {
  id: string[];
  name: string;
  disabled: boolean;
}

@Component({
  selector: 'vt-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComponent {
  private readonly _data$: Subject<Idea[] | null> = new BehaviorSubject<Idea[] | null>(null);
  private readonly _store: SelectFacade = inject(SelectFacade);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  public controlSearch: FormControl<string> = new FormControl('', { nonNullable: true });
  public controlFilterStock: FormControl<FilterListItem[]> = new FormControl([], { nonNullable: true });
  public controlFilterStrategy: FormControl<FilterListItem[]> = new FormControl([], { nonNullable: true });
  public openMore = false;
  public constants: { [key in EntryEnums]: string } = ENTRY_CONSTANTS;
  public filterStock: FilterListItem[] = MAIN_FILTER_STOCK;
  public filterStrategy: FilterListItem[] = STOCK_STRATEGY_LIST;
  readonly size = 's';

  public readonly data$: Observable<Idea[] | null> = this._data$.asObservable().pipe(
    switchMap((data: Idea[] | null) =>
      combineLatest([
        this.controlSearch.valueChanges.pipe(
          map((value: string) => value.trim().toLowerCase()),
          startWith(this.controlSearch.value)
        ),
        this.controlFilterStock.valueChanges.pipe(startWith(this.controlFilterStock.value)),
        this.controlFilterStrategy.valueChanges.pipe(startWith(this.controlFilterStrategy.value)),
      ]).pipe(
        map(([search, stock, strategy]: [string, FilterListItem[], FilterListItem[]]) =>
          this._filterData(this._searchData(data, search), stock, strategy)
        )
      )
    )
  );

  disabledItemHandler: TuiBooleanHandler<FilterListItem> = (item: FilterListItem) => item.disabled;

  @Input()
  set data(value: Idea[] | null) {
    this.filterStock = this._updateFilterList(MAIN_FILTER_STOCK, value, (item: Idea) => item.instrument.type);
    this.filterStrategy = this._updateFilterList(STOCK_STRATEGY_LIST, value, (item: Idea) => item.strategy.type);

    this._data$.next(value);
  }

  private _updateFilterList(list: FilterListItem[], data: Idea[] | null, fn: (d: Idea) => string): FilterListItem[] {
    const types: string[] = [...new Set((data || []).map((item: Idea) => fn(item)))];

    return list.map((item: FilterListItem) => ({
      ...item,
      disabled: !types.some((type: string) => item.id.includes(type)),
    }));
  }

  private _searchData(data: Idea[] | null, search: string | null): Idea[] | null {
    if (data === null) {
      return data;
    }

    if (!search) {
      return data;
    }

    return data.filter((item: Idea) => {
      const concat = [item.instrument.ticker, item.instrument.name].map((item: string) => item.toLowerCase()).join('⁂');

      return concat.indexOf(search) !== -1;
    });
  }

  private _filterData(
    data: Idea[] | null,
    valueStock: FilterListItem[],
    valueStrategy: FilterListItem[]
  ): Idea[] | null {
    if (data === null) {
      return data;
    }
    const mapStock = this._getObject(valueStock);
    const mapStrategy = this._getObject(valueStrategy);

    return data.filter((item: Idea) => {
      return (
        (!valueStock.length || mapStock[item.instrument.type]) &&
        (!valueStrategy.length || mapStrategy[item.strategy.type])
      );
    });
  }

  private _getObject(list: FilterListItem[]): { [key: string]: boolean } {
    return list.reduce(
      (acc: { [key: string]: boolean }, item: FilterListItem) => ({
        ...acc,
        ...item.id.reduce((common, uid: string) => ({ ...common, [uid]: true }), {}),
      }),
      {}
    );
  }

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

  onOpenDialog(event: Event): void {
    event.preventDefault();

    this._store.instrument$
      .pipe(
        take(1),
        takeUntilDestroyed(this._destroyRef),
        filter((instrument: null | StockInstrument): instrument is StockInstrument => instrument !== null)
      )
      .subscribe((instrument: StockInstrument) => {
        this._queryParams.update({
          type: EventSelected.STOCK_LIST,
          id: instrument.id,
          dialog: 'visible',
        });
      });
  }
}
