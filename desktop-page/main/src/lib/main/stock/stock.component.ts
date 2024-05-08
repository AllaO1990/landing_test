import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiInputModule, TuiSelectModule } from '@taiga-ui/kit';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiLoaderModule,
  TuiSvgModule,
  TuiTextfieldControllerModule
} from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiAutoFocusModule, TuiStringHandler } from '@taiga-ui/cdk';
import { BehaviorSubject, combineLatest, Observable, startWith, Subject, tap } from 'rxjs';
import { StockListComponent } from './list/list.component';
import { filter, map } from 'rxjs/operators';
import {
  StockGroup,
  StockGroupType,
  StockId,
  StockList,
  StockListItemWithPrice,
  StockListPrice,
  StockPrice,
  StockUserGroup
} from 'types/stock';
import { DESKTOP_STORE } from 'tokens/desktop';
import { DesktopLkStore } from '../../../../../../stores/desktop';
import { StockService } from './stock.service';
import { STOCK_GROUPS } from './stock.constant';
import { EventSelected } from 'types/events';

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
    TuiLoaderModule
  ],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss'],
  providers: [StockService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockComponent {
  private _map: Map<StockGroup, StockList> = new Map<StockGroup, StockList>();

  private readonly _service: StockService = inject(StockService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _price$: Subject<StockPrice<StockListPrice> | null> = new BehaviorSubject<StockPrice<StockListPrice> | null>(null);
  private readonly _groups$: Subject<StockGroup[]> = new BehaviorSubject<
    StockGroup[]
  >([]);

  public readonly defaultGroups = STOCK_GROUPS;
  public groups = STOCK_GROUPS;

  public loaded = false;

  public signatureVisible: boolean = false;


  public readonly controlGroup: FormControl<StockGroup | null> =
    new FormControl<StockGroup | null>(null);

  public readonly controlGroupName: FormControl<string | null> = new FormControl<
    string | null
  >(null);

  @Input() set group(value: StockUserGroup[] | null) {
    if (value) {
    }
  }

  @Input() set list(value: StockList | null) {
    if (value) {
      this.loaded = true;
      const groups: StockGroup[] = [];
      this._map = this._service.getMapGroupList(value, this.defaultGroups, this._map);

      this._map.forEach((_: StockList, key: StockGroup) => {
        groups.push(key);
      });

      this.groups = groups;
      this._groups$.next(groups);
      this.controlGroup.patchValue(groups[0]);
    }
  }

  @Input()
  set price(value: StockPrice<StockListPrice> | null) {
    this._price$.next(value);
  }

  public readonly stringify: TuiStringHandler<StockGroup> = (item: StockGroup) =>
    item.name;

  public readonly groups$: Observable<StockGroup[]> =
    this._groups$.asObservable();

  public readonly list$: Observable<StockListItemWithPrice[]> = combineLatest([
    this.controlGroup.valueChanges.pipe(
      startWith(this.controlGroup.value),
      filter((value: StockGroup | null): value is StockGroup => value !== null),
      map((value: StockGroup) => this._map.get(value) || []),
      tap((list: StockList) => this._store.updateActive(list)),
    ),
    this._price$.asObservable()
  ]).pipe(
    map(([list, price]: [StockList | null, StockPrice<StockListPrice> | null]) => this._service.getListWithPrice(list, price))
  );

  public toggle(): void {
    this.signatureVisible = !this.signatureVisible;
  }

  public addGroup(event: Event): void {
    event.preventDefault();

    this._createGroup();
    this.toggle();
  }

  public trackByGroupId(_: number, item: StockGroup): StockId {
    return item.id;
  }

  public onSelect(value: unknown ): void {
    // console.log(value);
    this._store.updateSelect({type: EventSelected.STOCK_LIST, value});
  }

  private _createGroup(): void {
    const stockName: StockGroup = {
      id: new Date().toISOString(),
      name: this.controlGroupName.value as string,
      type: StockGroupType.CUSTOM
    };

    this.groups.push(stockName);
    this._groups$.next(this.groups);

    if (this._map) {
      this._map.set(stockName, []);
    }

    this.controlGroup.patchValue(stockName);
    this.controlGroupName.reset();
  }
}
