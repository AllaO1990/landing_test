import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ENTRY_CONSTANTS } from './entry.constants';
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
import { Position } from 'types/position';
import { searchPosition } from '../common/utils/search-position';
import { AccountStrategies } from 'types/account';

interface StockInstrumentWithMap {
  id: string;
  name: string;
  map: string[];
  disabled: boolean;
}

interface AccountStrategiesWithMap extends AccountStrategies {
  map: string[];
  disabled: boolean;
}

@Component({
  selector: 'vt-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComponent {
  private readonly _data$: Subject<Position[] | null> = new BehaviorSubject<Position[] | null>(null);
  private readonly _store: SelectFacade = inject(SelectFacade);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly instrumentType = (d: Position) => d.instrument.type;
  readonly mainFilterId = (d: StockInstrumentWithMap) => d.id;
  readonly strategyType = (d: Position) => d.strategy.type;
  readonly stockStrategyKey = (d: AccountStrategiesWithMap) => d.key;

  public controlSearch: FormControl<string> = new FormControl('', { nonNullable: true });
  public controlFilterStock: FormControl<StockInstrumentWithMap[]> = new FormControl([], { nonNullable: true });
  public controlFilterStrategy: FormControl<AccountStrategiesWithMap[]> = new FormControl([], { nonNullable: true });
  public openMore = false;
  public constants: { [key in EntryEnums]: string } = ENTRY_CONSTANTS;
  public filterStock: StockInstrumentWithMap[] = this._updateFilterList(
    MAIN_FILTER_STOCK,
    null,
    this.instrumentType,
    this.mainFilterId
  );
  public filterStrategy: AccountStrategiesWithMap[] = this._updateFilterList(
    STOCK_STRATEGY_LIST,
    null,
    this.strategyType,
    this.stockStrategyKey
  );
  readonly size = 's';

  public readonly data$: Observable<Position[] | null> = this._data$.asObservable().pipe(
    switchMap((data: Position[] | null) =>
      combineLatest([
        this.controlSearch.valueChanges.pipe(
          map((value: string) => value.trim().toLowerCase()),
          startWith(this.controlSearch.value)
        ),
        this.controlFilterStock.valueChanges.pipe(startWith(this.controlFilterStock.value)),
        this.controlFilterStrategy.valueChanges.pipe(startWith(this.controlFilterStrategy.value)),
      ]).pipe(
        map(([search, stock, strategy]: [string, StockInstrumentWithMap[], AccountStrategiesWithMap[]]) =>
          this._filterData(searchPosition(data, search), stock, strategy)
        )
      )
    )
  );

  disabledItemHandler: TuiBooleanHandler<{ disabled: boolean }> = (item: { disabled: boolean }) => item.disabled;

  @Input()
  set data(value: Position[] | null) {
    this.filterStock = this._updateFilterList(MAIN_FILTER_STOCK, value, this.instrumentType, this.mainFilterId);
    this.filterStrategy = this._updateFilterList(STOCK_STRATEGY_LIST, value, this.strategyType, this.stockStrategyKey);

    this._data$.next(value);
  }

  private _updateFilterList<T>(
    list: any[],
    data: Position[] | null,
    fnType: (d: Position) => string,
    fnKey: (d: T) => string
  ): T[] {
    const types: string[] = [...new Set((data || []).map((item: Position) => fnType(item)))];

    return list.map((item: T) => {
      const map: string[] = types.filter((type: string) => type.indexOf(fnKey(item)) !== -1);

      return {
        ...item,
        map: [...map, fnKey(item)],
        disabled: !map.length,
      };
    });
  }

  private _filterData(
    data: Position[] | null,
    valueStock: StockInstrumentWithMap[],
    valueStrategy: AccountStrategiesWithMap[]
  ): Position[] | null {
    if (data === null) {
      return data;
    }
    const mapStock = this._getObject(valueStock);
    const mapStrategy = this._getObject(valueStrategy);

    return data.filter((item: Position) => {
      return (
        (!valueStock.length || mapStock[item.instrument.type]) &&
        (!valueStrategy.length || mapStrategy[item.strategy.type])
      );
    });
  }

  private _getObject(list: { map: string[] }[]): { [key: string]: boolean } {
    return list.reduce(
      (acc: { [key: string]: boolean }, item: { map: string[] }) => ({
        ...acc,
        ...item.map.reduce((common, uid: string) => ({ ...common, [uid]: true }), {}),
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
        takeUntilDestroyed(this._destroyRef),
        take(1),
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
