import {
  AfterContentInit,
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
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { BehaviorSubject, Observable, Subject, switchMap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StockListItem, StockListItemWithPrice } from 'types/stock';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { TuiFormatNumberPipeModule, TuiScrollbarModule } from '@taiga-ui/core';

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
    TuiFormatNumberPipeModule,
    TuiScrollbarModule,
  ],
})
export class StockListComponent implements AfterContentInit {
  private readonly _list$: Subject<StockListItemWithPrice[] | null> =
    new BehaviorSubject<StockListItemWithPrice[] | null>(null);

  public list$: Observable<StockListItemWithPrice[] | null> =
    this._list$.asObservable();

  @Output() selected: Observable<unknown> = this.list$.pipe(
    filter(
      (
        list: StockListItemWithPrice[] | null
      ): list is StockListItemWithPrice[] => !!list
    ),
    switchMap((list: StockListItemWithPrice[]) =>
      this.controlItem.valueChanges.pipe(
        map((value: string) =>
          list.find((item: StockListItemWithPrice) => item.id === value)
        )
      )
    )
  );

  public readonly controlItem: FormControl = new FormControl<string | null>(
    null
  );

  public readonly header: { name: string; label: string }[] = STOCK_LIST_HEADER;

  @Input()
  set list(value: StockListItemWithPrice[]) {
    this._list$.next(value);
  }

  public trackByHeader(
    index: number,
    _: { name: string; label: string }
  ): number {
    return index;
  }

  public trackByStockListItem(_: number, item: StockListItem): string {
    return item.id;
  }

  ngAfterContentInit(): void {
    this.controlItem.patchValue('72187db2-44d8-4b2e-8b43-c41fd30c4a39');
  }
}
