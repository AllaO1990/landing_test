import {ChangeDetectionStrategy, Component, Input, Output,} from '@angular/core';
import {STOCK_LIST_HEADER} from '../stock.constant';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport,} from '@angular/cdk/scrolling';
import {StockListItemComponent} from '../item/item.component';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import {StockListItem, StockListItemPrice, StockPrice} from 'types/stock';
import {EventSelected} from 'types/events';
import {TuiTableModule} from '@taiga-ui/addon-table';
import {TuiFormatNumberPipeModule} from "@taiga-ui/core";

type StockListItemFull = StockListItem & { price: null | number; change: null | number; changePercent: null | number };

@Component({
  selector: 'vt-stock-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    StockListItemComponent,
    TuiTableModule,
    AsyncPipe,
    TuiFormatNumberPipeModule
  ],
})
export class StockListComponent {
  private readonly _list$: Subject<StockListItem[] | null> = new BehaviorSubject<StockListItem[] | null>(null);
  private readonly _price$: Subject<StockPrice<StockListItemPrice> | null> = new BehaviorSubject<StockPrice<StockListItemPrice> | null>(null);

  public list$: Observable<StockListItemFull[]> = combineLatest([
    this._list$.asObservable(),
    this._price$.asObservable()
  ]).pipe(
    map(([list, price]: [StockListItem[] | null, StockPrice<StockListItemPrice> | null]) => this._getList(list, price))
  );

  public readonly controlItem: FormControl =
    new FormControl<StockListItem | null>(null);

  public readonly header: { name: string; label: string }[] = STOCK_LIST_HEADER;

  @Input()
  set list(value: StockListItem[]) {
    this.controlItem.patchValue(value && value.length > 0 ? value[0] : null);
    this._list$.next(value);
  }

  @Input()
  set price(value: StockPrice<StockListItemPrice> | null) {
    this._price$.next(value);
  }

  @Output() selected: Observable<{ type: EventSelected; value: unknown }> =
    this.controlItem.valueChanges.pipe(
      map((value: StockListItem) => ({type: EventSelected.STOCK_LIST, value}))
    );

  public trackByHeader(
    index: number,
    _: { name: string; label: string }
  ): number {
    return index;
  }

  public trackByStockListItem(_: number, item: StockListItem): string {
    return item.id;
  }

  private _getList(list: StockListItem[] | null, price: StockPrice<StockListItemPrice> | null): StockListItemFull[] {
    if (!list) {
      return [];
    }

    if (!price) {
      return list.map((item: StockListItem) => ({...item, price: null, change: null, changePercent: null}));
    }

    return list.map((item: StockListItem) => {
      if (price[item.id] === null) {
        return ({...item, price: null, change: null, changePercent: null})
      }

      const {prev, last} = price[item.id] as StockListItemPrice;

      return {...item, price: last, change: last - prev, changePercent: (last - prev) / last * 100}
    });
  }
}
