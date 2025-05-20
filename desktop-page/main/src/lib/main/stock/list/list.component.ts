import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { STOCK_LIST_HEADER } from '../stock.constant';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AsyncPipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { BehaviorSubject, combineLatest, Observable, Subject, switchMap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StockGroupType, StockInstrument, StockListItemWithPrice } from 'types/stock';
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiFormatNumberPipe,
  TuiHintComponent,
  TuiHintDirective,
  TuiHintUnstyled,
  TuiScrollable,
  TuiScrollbar,
} from '@taiga-ui/core';
import { StockEvent } from 'types/stock-event';
import { EventSelected } from 'types/events';
import { StockListWithType } from '../stock.component';
import { StockListItemComponent } from '../item';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IconTickerComponent } from '@ui/components/icon-ticker';
import { TuiBooleanHandler } from '@taiga-ui/cdk';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';

@Pipe({
  name: 'stockItemRemove',
  standalone: true,
})
export class StockListRemovePipe implements PipeTransform {
  transform(value: StockGroupType): boolean {
    return StockGroupType.CUSTOM === value;
  }
}

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
    AsyncPipe,
    TuiScrollbar,
    NgTemplateOutlet,
    StockListRemovePipe,
    TuiButton,
    TuiScrollable,
    TuiFormatNumberPipe,
    TuiHintDirective,
    TuiHintComponent,
    TuiHintUnstyled,
    IconTickerComponent,
    TuiDropdown,
    TuiDataList,
  ],
  providers: [],
})
export class StockListComponent implements AfterContentInit {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _list$: Subject<StockListWithType | null> = new BehaviorSubject<StockListWithType | null>(null);
  private readonly _event$: Subject<StockEvent | null> = new BehaviorSubject<StockEvent | null>(null);

  readonly list$: Observable<StockListWithType | null> = this._list$.asObservable();

  @Output() selected: Observable<{ id: string; type: EventSelected }> = this.list$.pipe(
    filter((list: StockListWithType | null): list is StockListWithType => list !== null),
    switchMap((list: StockListWithType) =>
      this.controlItem.valueChanges.pipe(
        map((value: string) => list.items.find((item: StockListItemWithPrice) => item.id === value)!),
        map((instrument: StockInstrument) => ({ id: instrument.id, type: list.type.event, group: list.id }))
      )
    )
  );

  @Output() delete: EventEmitter<StockInstrument> = new EventEmitter<StockInstrument>();

  public readonly controlItem: FormControl = new FormControl<string | null>(null);

  public readonly header: { name: string; label: string }[] = STOCK_LIST_HEADER;

  @Input()
  set list(value: StockListWithType) {
    this._list$.next(value);
  }

  @Input()
  set select(value: null | StockEvent) {
    this._event$.next(value);
  }

  trackByHeader(index: number, _: { name: string; label: string }): number {
    return index;
  }

  trackByStockListItem(_: number, item: StockInstrument): string {
    return item.id;
  }

  disabledItemHandler = (items: StockInstrument[]): TuiBooleanHandler<any> => {
    const map = new Map(items.map((item) => [item.id, item] as [string, StockInstrument]));

    return (id) => {
      const instrument = map.get(id);

      if (!instrument) {
        return false;
      }

      return !instrument.inSub || instrument.subscriptionStatus === 0;
    };
  };

  onRemove(event: Event, item: StockInstrument): void {
    event.stopPropagation();

    this.delete.emit(item);
  }

  ngAfterContentInit(): void {
    combineLatest([this._event$, this.list$])
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map(([event]: [StockEvent | null, StockListWithType | null]) => event)
      )
      .subscribe((event: StockEvent | null) => this.controlItem.patchValue(event && event.id, { emitEvent: false }));
  }

  openDialogIdea(event: Event, item: StockInstrument): void {
    event.preventDefault();

    this.#queryParams.update({
      type: EventSelected.STOCK_LIST,
      id: item.id,
      dialog: 'visible',
    });
  }

  // private _getValue(event: StockEvent | null, type: EventSelected | null): number | null {
  //   if (event === null || event.type !== type) {
  //     return null;
  //   }
  //   return event.id;
  // }
}
