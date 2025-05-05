import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input } from '@angular/core';
import { OUT_CONSTANTS } from './out.constants';
import { OutEnums } from './out.enums';
import { MAIN_FILTER_STOCK } from '../main.constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { Position } from 'types/position';
import { BehaviorSubject, combineLatest, Observable, startWith, Subject, switchMap } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import {
  TuiActiveZone,
  TuiAutoFocus,
  TuiBooleanHandler,
  TuiContext,
  TuiIdentityMatcher,
  TuiObscured,
  TuiStringHandler,
} from '@taiga-ui/cdk';
import { OutTableComponent } from './table/table.component';
import { TuiDataListWrapperComponent } from '@taiga-ui/kit';
import { TuiInputModule, TuiMultiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiButton, TuiDropdown } from '@taiga-ui/core';
import { AsyncPipe } from '@angular/common';
import { searchPosition } from '../common/utils/search-position';
import { AccountStrategy } from 'types/account';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventSelected } from 'types/events';
import { SelectFacade } from 'stores/facades/select.facade';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';

interface StockInstrumentWithMap {
  id: string;
  name: string;
  map: string[];
  disabled: boolean;
}

interface AccountStrategiesWithMap extends AccountStrategy {
  map: string[];
  disabled: boolean;
}

@Component({
  selector: 'vt-out',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    OutTableComponent,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiButton,
    ...TuiDropdown,
    TuiActiveZone,
    TuiObscured,
    AsyncPipe,
    TuiAutoFocus,
    TuiDataListWrapperComponent,
    TuiMultiSelectModule,
  ],
  templateUrl: './out.component.html',
  styleUrls: ['./out.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutComponent {
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly _data$: Subject<Position[] | null> = new BehaviorSubject<Position[] | null>(null);
  readonly #store: SelectFacade = inject(SelectFacade);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  public readonly constants: { [key in OutEnums]: string } = OUT_CONSTANTS;

  readonly instrumentType = (d: Position) => d.instrument.type;
  readonly mainFilterId = (d: StockInstrumentWithMap) => d.id;
  readonly strategyType = (d: Position) => d.strategy.type;
  readonly stockStrategyKey = (d: AccountStrategiesWithMap) => d.key;

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

  public readonly controlSearch: FormControl<string> = new FormControl('', { nonNullable: true });
  public readonly controlFilterStock: FormControl<StockInstrumentWithMap[]> = new FormControl([], {
    nonNullable: true,
  });
  public readonly controlFilterStrategy: FormControl<AccountStrategiesWithMap[]> = new FormControl([], {
    nonNullable: true,
  });
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

  public openMore = false;

  readonly stringify: TuiStringHandler<StockInstrumentWithMap | TuiContext<StockInstrumentWithMap>> = (item) =>
    'name' in item ? item.name : item.$implicit.name;

  readonly identityMatcher: TuiIdentityMatcher<StockInstrumentWithMap> = (a, b) => a.id === b.id;

  disabledItemHandler: TuiBooleanHandler<{ disabled: boolean }> = (item: { disabled: boolean }) => item.disabled;

  @Input()
  set data(value: Position[] | null) {
    this.filterStock = this._updateFilterList(MAIN_FILTER_STOCK, value, this.instrumentType, this.mainFilterId);
    this.filterStrategy = this._updateFilterList(STOCK_STRATEGY_LIST, value, this.strategyType, this.stockStrategyKey);

    this._data$.next(value);
    this._cdr.markForCheck();
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

    this.#store.instrument$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        take(1),
        filter((instrumentId: null | string): instrumentId is string => instrumentId !== null)
      )
      .subscribe((instrument: string) => {
        this.#queryParams.update({
          type: EventSelected.STOCK_LIST,
          id: instrument,
          dialog: 'visible',
        });
      });
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
}
