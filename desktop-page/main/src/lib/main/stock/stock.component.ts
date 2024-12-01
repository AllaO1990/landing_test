import { TuiInputModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiDataListWrapper } from '@taiga-ui/kit';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiAutoFocus, TuiStringHandler } from '@taiga-ui/cdk';
import { combineLatest, Observable, startWith } from 'rxjs';
import { filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import {
  StockGroup,
  StockGroupList,
  StockGroupType,
  StockId,
  StockInstrument,
  StockListItemWithPrice,
  StockPrice,
  WithLastPrice,
} from 'types/stock';
import { QUERY_PARAMS } from 'tokens/desktop';
import { StockService } from './stock.service';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { FormInputComponent } from './form-input';
import { FormInputEvent } from './form-input/form-input.types';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { DialogComponent } from './dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoaderComponent } from '@ui/components/loader';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { StockListComponent } from './list';
import { StockListFacade } from 'stores/facades/stock-list.facade';
import { SearchDialogComponent } from 'ui-common/lib/search-dialog';
import { SelectFacade } from 'stores/facades/select.facade';
import { StockEvent } from 'types/stock-event';

type IsRename = 'edit' | 'new' | false;

export type StockListWithType = StockGroup & {
  items: StockListItemWithPrice[];
};

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
    SearchDialogComponent,
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
  private readonly _stock: StockListFacade = inject(StockListFacade);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _dialogService: DialogService = inject(DIALOG);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _dialogApproveContent: PolymorpheusContent = new PolymorpheusComponent(
    DialogComponent,
    this._injector
  );

  private _loadComponent: PolymorpheusComponent<SearchDialogComponent> | null = null;

  readonly size = 's';

  isRename: IsRename = false;
  default: StockGroupList = {
    id: '',
    name: 'Новый список',
    type: {
      action: StockGroupType.CUSTOM,
      event: EventSelected.STOCK_LIST,
    },
    items: [],
  };
  isDisabled = true;

  public readonly controlGroup: FormControl<StockGroup | null> = new FormControl<StockGroup | null>({
    value: null,
    disabled: this.isDisabled,
  });

  readonly controlRename: FormControl<StockGroup | null> = new FormControl<StockGroup | null>(null);

  readonly stringify: TuiStringHandler<StockGroup> = (item: StockGroup) => item.name;

  private readonly _group$: Observable<StockGroupList[] | null> = this._stock.group$.pipe(
    shareReplay({
      bufferSize: 1,
      refCount: true,
    })
  );

  readonly groupsCustom$: Observable<StockGroupList[] | null> = this._group$.pipe(
    filter((list: StockGroupList[] | null): list is StockGroupList[] => list !== null),
    map((list: StockGroupList[]) => list.filter((item: StockGroupList) => item.type.action === StockGroupType.CUSTOM))
  );

  readonly groupDefault$: Observable<StockGroupList[] | null> = this._group$.pipe(
    filter((list: StockGroupList[] | null): list is StockGroupList[] => list !== null),
    map((list: StockGroupList[]) => list.filter((item: StockGroupList) => item.type.action === StockGroupType.DEFAULT))
  );

  public readonly list$: Observable<any> = this.controlGroup.valueChanges.pipe(
    startWith(this.controlGroup.value),
    filter((value: StockGroup | null): value is StockGroup => value !== null),
    switchMap((value: StockGroup) => this._stock.selectStockGroupList(value.id)),
    filter((group: StockGroupList | null): group is StockGroupList => group !== null),
    tap((group: StockGroupList) => this._stock.loadPrice(group.items.map((item) => item.id))),
    switchMap((group: StockGroupList) =>
      this._stock.listPrice$.pipe(
        filter((price: StockPrice<WithLastPrice> | null): price is StockPrice<WithLastPrice> => price !== null),
        map((price: StockPrice<WithLastPrice>) => ({
          ...group,
          items: this._service.getListWithPrice(group.items, price),
        }))
      )
    )
  );

  event$: Observable<null | StockEvent> = this._stock.event$;

  constructor() {
    this._initGroupSelected();
  }

  onSelect(value: { type: EventSelected; id: StockId }): void {
    this._queryParams.update(value);
  }

  async onAddInstrument(event: Event): Promise<void> {
    event.preventDefault();

    this._loadComponent = await import('ui-common/lib/search-dialog')
      .then((m) => m.SearchDialogComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this.showDialog<StockInstrument | null, null>(this._loadComponent, {
      appearance: 'search-dialog',
      data: null,
    }).subscribe((instrument: StockInstrument | null) => {
      if (instrument !== null && this.controlGroup.value !== null) {
        this._stock.addInstrument({
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
        this._stock.createGroup(event.changed);
        this.isRename = false;
        this._isOpenCreatedGroup(event.changed);

        return;
      }

      if (this.isRename === 'edit' && event.changed) {
        this._stock.editGroup({ id: event.value.id, name: event.changed });
        this.isRename = false;
        this._isChangeGroupSelected(event.value);

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
        this._stock.deleteGroup(item.id);
        this._initGroupSelected();
      }
    });
  }

  onDeleteInstrument(event: StockInstrument): void {
    if (event !== null && this.controlGroup.value !== null) {
      this._stock.deleteInstrument({ instrumentId: event.id, instrumentsListId: this.controlGroup.value.id });
    }
  }

  showDialog<T, D>(component: PolymorpheusContent, options: { data: D; appearance: string }): Observable<T> {
    return this._dialogService.open<T>(component, options).pipe(takeUntilDestroyed(this._destroyRef));
  }

  /**
   * Если выбрана группа в select, нужно изменить название в select после редактирования названия группы
   */
  private _isChangeGroupSelected(group: StockGroup): void {
    if (this.controlGroup.value && group.id === this.controlGroup.value.id) {
      this._stock
        .selectStockGroupList(group.id)
        .pipe(
          filter(
            (group: StockGroupList | null): group is StockGroupList => group !== null && group.name !== group.name
          ),
          take(1)
        )
        .subscribe((group: StockGroupList | null) => {
          if (group) {
            this.controlGroup.patchValue(group, {
              emitEvent: false,
            });
          }
        });
    }
  }

  /**
   * Выбрать группу, в которой есть выбранный тикер
   * Отрабатывает 1 раз
   */
  private _initGroupSelected(): void {
    combineLatest([
      this._select.event$.pipe(filter((event: null | StockEvent): event is StockEvent => event !== null)),
      this._group$.pipe(filter((list: StockGroupList[] | null): list is StockGroupList[] => list !== null)),
    ])
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        take(1),
        map(([event, list]: [StockEvent, StockGroupList[]]): StockGroupList | null => {
          if (event.type === EventSelected.WATCH_LIST) {
            return list.find((item: StockGroupList) => item.id === 'watch') || null;
          }

          return (
            list
              .filter((item: StockGroupList) => item.id !== 'watch')
              .find((group: StockGroupList) => group.items.find((item: StockInstrument) => item.id === event.id)) ||
            null
          );
        })
      )
      .subscribe((group: StockGroupList | null) => {
        if (group) {
          this.controlGroup.patchValue(group);
          this.controlGroup.enable({ emitEvent: false });
          this.isDisabled = false;
        }
      });
  }

  /**
   * Открывает созданную группу
   * Отрабатывает 1 раз
   */
  private _isOpenCreatedGroup(name: string): void {
    this._stock.group$
      .pipe(
        filter((list: StockGroupList[] | null): list is StockGroupList[] => list !== null),
        map((list: StockGroupList[]) => list.find((item: StockGroupList) => item.name === name) || null),
        filter((group: StockGroupList | null) => group !== null),
        take(1)
      )
      .subscribe((group) => this.controlGroup.patchValue(group));
  }
}
