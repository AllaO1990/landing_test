import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiInputModule, TuiSelectModule } from '@taiga-ui/kit';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiLoaderModule,
  TuiSvgModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiAutoFocusModule, TuiStringHandler } from '@taiga-ui/cdk';
import { combineLatest, debounceTime, Observable, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { StockListComponent } from './list/list.component';
import { filter, map } from 'rxjs/operators';
import {
  StockGroup,
  StockGroups,
  StockId,
  StockInstrument,
  StockListItems,
  StockListItemWithPrice,
  StockPrice,
  WithLastPrice,
} from 'types/stock';
import { DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { StockService } from './stock.service';
import { EventSelected } from 'types/events';
import { DesktopLkStore } from 'stores/desktop';
import { QueryParams } from 'utils/query-params';

export interface StockListWithType {
  type: EventSelected;
  items: StockListItemWithPrice[];
}

@Component({
  selector: 'vt-stock',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiDataListModule,
    NgIf,
    TuiSvgModule,
    AsyncPipe,
    NgForOf,
    TuiInputModule,
    TuiAutoFocusModule,
    TuiButtonModule,
    StockListComponent,
    TuiLoaderModule,
  ],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss'],
  providers: [StockService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockComponent {
  private readonly _service: StockService = inject(StockService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  public signatureVisible = false;

  public readonly controlGroup: FormControl<StockGroup | null> = new FormControl<StockGroup | null>(null);

  public readonly controlGroupName: FormControl<string | null> = new FormControl<string | null>(null);

  public readonly stringify: TuiStringHandler<StockGroup> = (item: StockGroup) => item.name;

  readonly groups$: Observable<StockGroups | null> = this._store.stockGroups$.pipe(
    tap((groups: StockGroups | null) => groups && this.controlGroup.patchValue(groups[0])),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly _list$: Observable<StockListItems> = this._store.stockMap$.pipe(
    filter(
      (stockMap: Map<string, StockListItems> | null): stockMap is Map<string, StockListItems> => stockMap !== null
    ),
    switchMap((stockMap: Map<string, StockListItems>) =>
      this.controlGroup.valueChanges.pipe(
        startWith(this.controlGroup.value),
        filter((value: StockGroup | null): value is StockGroup => value !== null),
        map((value: StockGroup) => stockMap.get(value.id) || []),
        tap((list: StockListItems) => this._store.updateStockActive(list.map((item: StockInstrument) => item.id)))
      )
    )
  );

  public readonly list$: Observable<StockListWithType> = combineLatest([
    this._list$,
    this._store.price$,
    this.controlGroup.valueChanges,
  ]).pipe(
    debounceTime(0),
    map(([list, price, value]: [StockListItems | null, StockPrice<WithLastPrice> | null, StockGroup | null]) => ({
      type: value && value.id === 'watch' ? EventSelected.WATCH_LIST : EventSelected.STOCK_LIST,
      items: this._service.getListWithPrice(list, price),
    }))
  );

  public toggle(): void {
    this.signatureVisible = !this.signatureVisible;
  }

  public addGroup(event: Event): void {
    event.preventDefault();

    // this._createGroup();
    this.toggle();
  }

  public trackByGroupId(_: number, item: StockGroup): StockId {
    return item.id;
  }

  public onSelect(value: StockInstrument): void {
    let type = EventSelected.STOCK_LIST;

    if (this.controlGroup.value) {
      type =
        (this.controlGroup.value as StockGroup).id === 'watch' ? EventSelected.WATCH_LIST : EventSelected.STOCK_LIST;
    }

    this._queryParams.update({
      type,
      id: value.id,
    });
  }

  private _createGroup(): void {
    // const stockName: StockGroup = {
    //   id: new Date().toISOString(),
    //   name: this.controlGroupName.value as string,
    //   type: StockGroupType.CUSTOM,
    // };
    //
    // this.groups.push(stockName);
    // this._groups$.next(this.groups);
    //
    // if (this._map) {
    //   this._map.set(stockName, []);
    // }
    //
    // this.controlGroup.patchValue(stockName);
    // this.controlGroupName.reset();
  }

  onRemove(event: Event, item: StockGroup): void {
    event.stopPropagation();

    console.log(item);
  }
}
