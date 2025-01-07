import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { OUT_CONSTANTS } from './out.constants';
import { OutEnums } from './out.enums';
import { MAIN_FILTER_STOCK } from '../main.constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { Position } from 'types/position';
import { BehaviorSubject, combineLatest, Observable, startWith, Subject, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { TuiActiveZone, TuiAutoFocus, TuiBooleanHandler, TuiObscured } from '@taiga-ui/cdk';
import { OutTableComponent } from './table/table.component';
import { TuiBlock, TuiFilter } from '@taiga-ui/kit';
import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiButton, TuiDropdown } from '@taiga-ui/core';
import { AsyncPipe } from '@angular/common';

interface FilterListItem {
  id: string[];
  name: string;
  disabled: boolean;
}

@Component({
  selector: 'vt-out',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    OutTableComponent,
    TuiFilter,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiButton,
    ...TuiDropdown,
    TuiActiveZone,
    TuiObscured,
    AsyncPipe,
    TuiBlock,
    TuiAutoFocus,
  ],
  templateUrl: './out.component.html',
  styleUrls: ['./out.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutComponent {
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly _data$: Subject<Position[] | null> = new BehaviorSubject<Position[] | null>(null);
  public readonly constants: { [key in OutEnums]: string } = OUT_CONSTANTS;
  public filterStock: FilterListItem[] = MAIN_FILTER_STOCK;
  public filterStrategy: FilterListItem[] = STOCK_STRATEGY_LIST;

  public readonly controlSearch: FormControl<string> = new FormControl('', { nonNullable: true });
  public readonly controlFilterStock: FormControl<FilterListItem[]> = new FormControl([], { nonNullable: true });
  public readonly controlFilterStrategy: FormControl<FilterListItem[]> = new FormControl([], { nonNullable: true });
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
        map(([search, stock, strategy]: [string, FilterListItem[], FilterListItem[]]) =>
          this._filterData(this._searchData(data, search), stock, strategy)
        )
      )
    )
  );

  public openMore = false;

  disabledItemHandler: TuiBooleanHandler<FilterListItem> = (item: FilterListItem) => item.disabled;

  @Input()
  set data(value: Position[] | null) {
    this.filterStock = this._updateFilterList(this.filterStock, value, (item: Position) => item.instrument.type);
    this.filterStrategy = this._updateFilterList(this.filterStrategy, value, (item: Position) => item.strategy.type);

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

  private _updateFilterList(
    list: FilterListItem[],
    data: Position[] | null,
    fn: (d: Position) => string
  ): FilterListItem[] {
    const types: string[] = [...new Set((data || []).map((item: Position) => fn(item)))];

    return list.map((item: FilterListItem) => ({
      ...item,
      disabled: !types.some((type) => item.id.includes(type)),
    }));
  }

  private _searchData(data: Position[] | null, search: string | null): Position[] | null {
    if (data === null) {
      return data;
    }

    if (!search) {
      return data;
    }

    return data.filter((item: Position) => {
      const concat = [item.instrument.ticker, item.instrument.name].map((item: string) => item.toLowerCase()).join('⁂');

      return concat.indexOf(search) !== -1;
    });
  }

  private _filterData(
    data: Position[] | null,
    valueStock: FilterListItem[],
    valueStrategy: FilterListItem[]
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

  private _getObject(list: FilterListItem[]): { [key: string]: boolean } {
    return list.reduce(
      (acc: { [key: string]: boolean }, item: FilterListItem) => ({
        ...acc,
        ...item.id.reduce((common, uid: string) => ({ ...common, [uid]: true }), {}),
      }),
      {}
    );
  }
}
