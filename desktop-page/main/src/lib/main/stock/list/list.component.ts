import { AfterContentInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Input, Output } from '@angular/core';
import { STOCK_LIST_HEADER } from '../stock.constant';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { StockListItemComponent } from '../item/item.component';
import { AsyncPipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { BehaviorSubject, Observable, Subject, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { StockId, StockInstrument, StockListItemWithPrice } from 'types/stock';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { TuiFormatNumberPipeModule, TuiHintModule, TuiScrollbarModule } from '@taiga-ui/core';
import { DesktopLkStore } from '../../../../../../../stores/desktop';
import { DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { StockEvent } from 'types/stock-event';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    TuiHintModule,
    NgTemplateOutlet,
  ],
})
export class StockListComponent implements AfterContentInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _list$: Subject<StockListItemWithPrice[] | null> = new BehaviorSubject<
    StockListItemWithPrice[] | null
  >(null);

  public list$: Observable<StockListItemWithPrice[] | null> = this._list$.asObservable();

  @Output() selected: Observable<StockInstrument> = this.list$.pipe(
    filter((list: StockListItemWithPrice[] | null): list is StockListItemWithPrice[] => !!list),
    switchMap((list: StockListItemWithPrice[]) =>
      this.controlItem.valueChanges.pipe(
        map((value: string) => list.find((item: StockListItemWithPrice) => item.id === value)!)
      )
    )
  );

  public readonly controlItem: FormControl = new FormControl<string | null>(null);

  public readonly header: { name: string; label: string }[] = STOCK_LIST_HEADER;

  @Input()
  set list(value: StockListItemWithPrice[]) {
    this._list$.next(value);
  }

  public trackByHeader(index: number, _: { name: string; label: string }): number {
    return index;
  }

  public trackByStockListItem(_: number, item: StockInstrument): StockId {
    return item.id;
  }

  ngAfterContentInit(): void {
    this._store.event$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map((event: StockEvent | null) => this._getValue(event)),
        distinctUntilChanged()
      )
      .subscribe((value: StockId | null) => {
        this.controlItem.patchValue(value, { emitEvent: false });
      });

    // this.controlItem.patchValue('72187db2-44d8-4b2e-8b43-c41fd30c4a39');

    //
    // this._store.selected$
    //   .pipe(
    //     filter((result: StockEvent | null) => this._conditionFilter(result))
    //   )
    //   .subscribe((_) =>
    //     this.controlItem.patchValue(null, { emitEvent: false })
    //   );
  }

  private _getValue(event: StockEvent | null): StockId | null {
    if (event === null || event.type !== EventSelected.STOCK_LIST) {
      return null;
    }
    return event.id;
  }
}
