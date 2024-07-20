import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OUT_CONSTANTS } from './out.constants';
import { OutEnums } from './out.enums';
import { MAIN_FILTER_STOCK } from '../main.constants';
import { FormControl } from '@angular/forms';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { Position } from 'types/position';
import { BehaviorSubject, combineLatest, Observable, startWith, Subject, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { TuiBooleanHandler } from '@taiga-ui/cdk';

interface FilterListItem {
  id: string;
  name: string;
  disabled: boolean;
}

@Component({
  selector: 'vt-out',
  templateUrl: './out.component.html',
  styleUrls: ['./out.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutComponent {
  private readonly _data$: Subject<Position[] | null> = new BehaviorSubject<Position[] | null>(null);
  public readonly constants: { [key in OutEnums]: string } = OUT_CONSTANTS;
  public filterStock: FilterListItem[] = MAIN_FILTER_STOCK;
  public filterStrategy: FilterListItem[] = STOCK_STRATEGY_LIST;

  public readonly controlSearch: FormControl<string | null> = new FormControl(null);
  public readonly controlFilterStock: FormControl<FilterListItem[]> = new FormControl([], { nonNullable: true });
  public readonly controlFilterStrategy: FormControl<FilterListItem[]> = new FormControl([], { nonNullable: true });

  public readonly data$: Observable<Position[] | null> = this._data$
    .asObservable()
    .pipe(
      switchMap((data: Position[] | null) =>
        combineLatest([
          this.controlFilterStock.valueChanges.pipe(startWith(this.controlFilterStock.value)),
          this.controlFilterStrategy.valueChanges.pipe(startWith(this.controlFilterStrategy.value)),
        ]).pipe(
          map(([stock, strategy]: [FilterListItem[], FilterListItem[]]) =>
            this._filterData(data || [], stock, strategy)
          )
        )
      )
    );

  public openMore = false;

  disabledItemHandler: TuiBooleanHandler<FilterListItem> = (item: FilterListItem) => item.disabled;

  @Input()
  set data(value: Position[] | null) {
    this.filterStock = this._updateFilterList(MAIN_FILTER_STOCK, value, (item: Position) => item.instrument.type);
    this.filterStrategy = this._updateFilterList(STOCK_STRATEGY_LIST, value, (item: Position) => item.strategy.type);

    this._data$.next(value);
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
      disabled: !types.includes(item.id),
    }));
  }

  private _filterData(data: Position[], valueStock: FilterListItem[], valueStrategy: FilterListItem[]): Position[] {
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
        [item.id]: true,
      }),
      {}
    );
  }
}
