import { AfterContentInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Input, Output } from '@angular/core';
import { STOCK_LIST_HEADER } from '../stock.constant';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { StockListItemComponent } from '../item/item.component';
import { AsyncPipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { BehaviorSubject, combineLatest, Observable, Subject, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { StockId, StockInstrument, StockListItemWithPrice } from 'types/stock';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { TuiFormatNumberPipeModule, TuiHintModule, TuiScrollbarModule } from '@taiga-ui/core';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';
import { StockEvent } from 'types/stock-event';
import { EventSelected } from 'types/events';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StockListWithType } from '../stock.component';

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
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _list$: Subject<StockListWithType | null> = new BehaviorSubject<StockListWithType | null>(null);

  public stockList$: Observable<StockListWithType | null> = this._list$.asObservable();

  public list$: Observable<StockListItemWithPrice[] | null> = this.stockList$.pipe(
    map((list: StockListWithType | null) => list && list.items)
  );

  @Output() selected: Observable<{ id: StockId; type: EventSelected }> = this.stockList$.pipe(
    filter((list: StockListWithType | null): list is StockListWithType => !!list),
    switchMap((list: StockListWithType) =>
      this.controlItem.valueChanges.pipe(
        map((value: string) => list.items.find((item: StockListItemWithPrice) => item.id === value)!),
        map((instrument: StockInstrument) => ({ id: instrument.id, type: list.type }))
      )
    )
  );

  public readonly controlItem: FormControl = new FormControl<string | null>(null);

  public readonly header: { name: string; label: string }[] = STOCK_LIST_HEADER;

  @Input()
  set list(value: StockListWithType) {
    this._list$.next(value);
  }

  public trackByHeader(index: number, _: { name: string; label: string }): number {
    return index;
  }

  public trackByStockListItem(_: number, item: StockInstrument): StockId {
    return item.id;
  }

  ngAfterContentInit(): void {
    combineLatest([
      this._store.event$,
      this.stockList$.pipe(
        map((list: StockListWithType | null) => list && list.type),
        distinctUntilChanged()
      ),
    ])
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map(([event, type]: [StockEvent | null, EventSelected | null]) => this._getValue(event, type)),
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

  private _getValue(event: StockEvent | null, type: EventSelected | null): StockId | null {
    if (event === null || event.type !== type) {
      return null;
    }
    return event.id;
  }
}
