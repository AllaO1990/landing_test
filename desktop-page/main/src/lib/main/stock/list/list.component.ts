import {ChangeDetectionStrategy, Component, Input, Output,} from '@angular/core';
import {STOCK_LIST_HEADER} from '../stock.constant';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport,} from '@angular/cdk/scrolling';
import {StockListItemComponent} from '../item/item.component';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import {StockListItem, StockListItemWithPrice} from 'types/stock';
import {EventSelected} from 'types/events';
import {TuiTableModule} from '@taiga-ui/addon-table';
import {TuiFormatNumberPipeModule} from "@taiga-ui/core";

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
  private readonly _list$: Subject<StockListItemWithPrice[] | null> = new BehaviorSubject<StockListItemWithPrice[] | null>(null);

  public list$: Observable<StockListItemWithPrice[] | null> = this._list$.asObservable();

  public readonly controlItem: FormControl =
    new FormControl<StockListItem | null>(null);

  public readonly header: { name: string; label: string }[] = STOCK_LIST_HEADER;

  @Input()
  set list(value: StockListItemWithPrice[]) {
    this.controlItem.patchValue(value && value.length > 0 ? value[0] : null);
    this._list$.next(value);
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
}
