import { TuiInputModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiDataListWrapper } from '@taiga-ui/kit';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiAutoFocus, TuiStringHandler } from '@taiga-ui/cdk';
import { combineLatest, debounceTime, Observable, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { StockListComponent } from './list';
import { filter, map } from 'rxjs/operators';
import {
  StockGroup,
  StockGroups,
  StockGroupType,
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
import { FormInputComponent } from './form-input';
import { FormInputEvent } from './form-input/form-input.types';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { DialogComponent } from './dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchCardComponent } from 'ui-common';
import { LoaderComponent } from '@ui/components/loader';
import { DIALOG, DialogService } from '@ui/components/dialog';

type IsRename = 'edit' | 'new' | false;

type MapGroup = Map<string, StockListItems>;

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
    TuiDataList,
    NgIf,
    TuiIcon,
    AsyncPipe,
    NgForOf,
    TuiInputModule,
    TuiAutoFocus,
    TuiButton,
    StockListComponent,
    TuiLoader,
    TuiDataListWrapper,
    TuiDropdown,
    FormInputComponent,
    DialogComponent,
    SearchCardComponent,
    LoaderComponent,
  ],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss'],
  providers: [StockService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockComponent {
  private readonly _injector: Injector = inject(Injector);
  private readonly _service: StockService = inject(StockService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _dialogService: DialogService = inject(DIALOG);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _dialogApproveContent: PolymorpheusContent = new PolymorpheusComponent(
    DialogComponent,
    this._injector
  );
  private readonly _dialogSearchContent: PolymorpheusContent = new PolymorpheusComponent(
    SearchCardComponent,
    this._injector
  );
  private readonly _destroyRef$: DestroyRef = inject(DestroyRef);

  isRename: IsRename = false;
  default: StockGroup = {
    id: '',
    name: 'Новый список',
    type: StockGroupType.CUSTOM,
  };
  isDisabled = true;

  public readonly controlGroup: FormControl<StockGroup | null> = new FormControl<StockGroup | null>({
    value: null,
    disabled: this.isDisabled,
  });

  readonly controlRename: FormControl<StockGroup | null> = new FormControl<StockGroup | null>(null);

  public readonly stringify: TuiStringHandler<StockGroup> = (item: StockGroup) => item.name;

  readonly groups$: Observable<StockGroups | null> = this._store.stockGroups$.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly groupsCustom$ = this.groups$.pipe(
    map((groups: StockGroups | null) =>
      groups ? groups.filter((item: StockGroup) => item.type === StockGroupType.CUSTOM) : null
    )
  );
  readonly groupsDefault$ = this.groups$.pipe(
    map((groups: StockGroups | null) =>
      groups ? groups.filter((item: StockGroup) => item.type === StockGroupType.DEFAULT) : null
    )
  );

  private readonly _list$: Observable<StockListItems> = this._store.stockMap$.pipe(
    filter((stockMap: MapGroup | null): stockMap is MapGroup => stockMap !== null),
    switchMap((stockMap: MapGroup) =>
      this.controlGroup.valueChanges.pipe(
        startWith(this.controlGroup.value),
        filter((value: StockGroup | null): value is StockGroup => value !== null),
        map((value: StockGroup) => stockMap.get(value.id)),
        filter((list: StockListItems | undefined): list is StockListItems => !!list),
        tap((list: StockListItems) => this._store.updateStockActive(list.map((item: StockInstrument) => item.id)))
      )
    )
  );

  public readonly list$: Observable<StockListWithType> = combineLatest([
    this._list$,
    this._store.price$.pipe(filter((price: StockPrice<WithLastPrice> | null) => !!price)),
    this.controlGroup.valueChanges.pipe(startWith(this.controlGroup.value)),
  ]).pipe(
    debounceTime(0),
    map(([list, price, value]: [StockListItems | null, StockPrice<WithLastPrice> | null, StockGroup | null]) => ({
      type: value && value.id === 'watch' ? EventSelected.WATCH_LIST : EventSelected.STOCK_LIST,
      items: this._service.getListWithPrice(list, price),
    }))
  );

  constructor() {
    this.groups$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((groups: StockGroups | null) => {
      if (groups) {
        this.controlGroup.patchValue(groups[0]);
        this.controlGroup.enable();
        this.isDisabled = false;
      }
    });
  }

  onSelect(value: { type: EventSelected; id: StockId }): void {
    this._queryParams.update(value);
  }

  onAddInstrument(event: Event): void {
    event.preventDefault();

    this.showDialog<StockInstrument | null, null>(this._dialogSearchContent, {
      appearance: 'search-card',
      data: null,
    }).subscribe((instrument: StockInstrument | null) => {
      if (instrument !== null && this.controlGroup.value !== null) {
        this._store.addStockInstrument({
          instrumentsListId: this.controlGroup.value.id,
          instrumentId: instrument.id,
        });
      }
    });
  }

  onFormEvent(event: FormInputEvent<StockGroup>): void {
    if (event.type === 'cancel') {
      this.isRename = false;
      return;
    }

    if (event.type === 'submit') {
      if (this.isRename === 'new' && event.changed) {
        this._store.createStockList(event.changed);
        this.isRename = false;
        this.controlGroup.patchValue(event.value);
        return;
      }

      if (this.isRename === 'edit' && event.changed) {
        this._store.editStockList({ id: event.value.id, name: event.changed });
        this.isRename = false;
        return;
      }
    }
  }

  onEdit(event: Event, item: StockGroup, type: IsRename): void {
    event.stopPropagation();

    this.isRename = type;
    this.controlRename.patchValue(item);
  }

  onRemove(event: Event, item: StockGroup): void {
    event.stopPropagation();

    this.showDialog<boolean, StockGroup>(this._dialogApproveContent, {
      data: item,
      appearance: 'dialog-remove',
    }).subscribe((result: boolean) => {
      if (result) {
        this._store.deleteStockList(item.id);
      }
    });
  }

  onDeleteInstrument(event: StockInstrument): void {
    if (event !== null && this.controlGroup.value !== null) {
      this._store.deleteStockInstrument({ instrumentId: event.id, instrumentsListId: this.controlGroup.value.id });
    }
  }

  showDialog<T, D>(component: PolymorpheusContent, options: { data: D; appearance: string }): Observable<T> {
    return this._dialogService.open<T>(component, options).pipe(takeUntilDestroyed(this._destroyRef$));
  }
}
