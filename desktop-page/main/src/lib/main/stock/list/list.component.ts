import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
} from '@angular/core';
import { STOCK_LIST_HEADER } from '../stock.constant';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { StockListItemComponent } from '../item/item.component';
import { TuiFormatNumberPipeModule } from '@taiga-ui/core';
import { NgForOf } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockListItem } from 'types/stock';
import { EventSelected } from 'types/events';

@Component({
  selector: 'vt-stock-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgForOf,
    ReactiveFormsModule,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    StockListItemComponent,
    TuiFormatNumberPipeModule,
  ],
})
export class StockListComponent {
  private _list: StockListItem[] = [];

  public readonly controlItem: FormControl =
    new FormControl<StockListItem | null>(null);

  public readonly header: { name: string; label: string }[] = STOCK_LIST_HEADER;

  @Input()
  set list(value: StockListItem[]) {
    if (value.length > 0) {
      this.controlItem.patchValue(value[0]);

      this._list = value;
    }
  }

  get list(): StockListItem[] {
    return this._list;
  }

  @Output() selected: Observable<{ type: EventSelected; value: unknown }> =
    this.controlItem.valueChanges.pipe(
      map((value: StockListItem) => ({ type: EventSelected.STOCK_LIST, value }))
    );

  public trackByHeader(
    index: number,
    _: { name: string; label: string }
  ): number {
    return index;
  }

  public trackByStockListItem(_: number, item: StockListItem): number | string {
    return item.figi;
  }
}
