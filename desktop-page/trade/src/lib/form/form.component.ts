import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
} from '@angular/core';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { TuiButtonLoading, TuiCheckbox } from '@taiga-ui/kit';
import {
  ControlValueAccessor,
  FormArray,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { TradeDialogService } from '../dialog/dialog.service';
import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { FilterComponent } from '../filter/filter.component';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap, timer } from 'rxjs';
import { StockPosition } from 'types/position';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeStore } from '../common/store';
import { Params } from '@angular/router';
import { DirectionTypePipe } from '../common/direction-type.pipe';
import { OrderTypePipe } from '../common/order-type.pipe';
import { TradeOrder } from '../common/api.types';

interface ItemEntry {
  direction: boolean;
  instrumentId: string;
  orderType: number;
  price: number;
  quantity: number;
}

@Component({
  selector: 'trade-form',
  standalone: true,
  imports: [
    ListComponent,
    HeaderComponent,
    ItemDirective,
    TuiCheckbox,
    ReactiveFormsModule,
    TuiButton,
    NgTemplateOutlet,
    TuiIcon,
    NgIf,
    AsyncPipe,
    TuiFormatNumberPipe,
    FilterComponent,
    TuiScrollbar,
    DirectionTypePipe,
    OrderTypePipe,
    TuiButtonLoading,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TradeFormComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeFormComponent implements ControlValueAccessor, AfterViewInit {
  readonly #injector: Injector = inject(Injector);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #service: TradeDialogService = inject(TradeDialogService);
  readonly #idea: IdeaFacade = inject(IdeaFacade);
  readonly #store: TradeStore = inject(TradeStore);

  #onChange = (_: any) => {};
  #onTouched = () => {};

  readonly controlAuto: FormControl<boolean> = new FormControl(true, { nonNullable: true });
  readonly formGroup: FormGroup = new FormGroup({
    entry: new FormArray([]),
    filter: new FormControl(null),
    auto: new FormControl(true, { nonNullable: true }),
  });

  get formArrayEntry(): FormArray {
    return this.formGroup.get('entry') as FormArray;
  }

  get controlFilter(): FormControl {
    return this.formGroup.get('filter') as FormControl;
  }

  readonly itemHeight = 28;

  readonly idea$: Observable<StockPosition> = this.#idea.idea$;
  readonly orders$: Observable<any> = this.#store.orders$;

  listEntry$: Observable<ItemEntry[]> = timer(500).pipe(
    switchMap(() => this.formArrayEntry.valueChanges.pipe(startWith(this.formArrayEntry.value)))
  );

  listOut = [
    {
      id: '3',
      type: { name: 'Тейк-профит', id: '4' },
      price: 1.5,
      amount: 2000,
      commission: 10,
      total: 3010,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'ИСПОЛНЕНО', id: '1' },
    },
    {
      id: '4',
      type: { name: 'Тейк-профит', id: '4' },
      price: 1.46,
      amount: 1000,
      commission: null,
      total: 1460,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'АКТИВНА', id: '2' },
    },
    {
      id: '5',
      type: { name: 'Тейк-профит', id: '4' },
      price: 1.37,
      amount: 1000,
      commission: null,
      total: 1370,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'АКТИВНА', id: '2' },
    },
    {
      id: '6',
      type: { name: 'Стоп-лосс', id: '5' },
      price: 1.61,
      amount: 4000,
      commission: null,
      total: 6440,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'АКТИВНА', id: '2' },
    },
  ];

  ngAfterViewInit(): void {
    this.#store.loadSources();
    this.#store.loadOrderTypes();

    this.idea$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((position: StockPosition) => {
      this.controlFilter.patchValue({
        instrument: position.idea.instrument,
      });

      this._updateControls(position);
    });

    // this.controlFilter.valueChanges.pipe().subscribe((filter) => console.log(filter));

    this.controlFilter.valueChanges
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.controlFilter.value),
        map((value) => ({
          sourceId: value.source && value.source.id,
          accountId: value.account && value.account.accountId,
          instrumentId: value.instrument && value.instrument.id,
        })),
        filter((value) => value.accountId !== null && value.instrumentId !== null && value.sourceId !== null),
        distinctUntilChanged()
      )
      .subscribe((params: Params) => this.#store.loadOrders(params));

    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.formGroup.value))
      .subscribe((value) => this.#onChange(value));
    //
    // this.#api.getOrderTypes().subscribe((value: any) => console.log(value));
  }

  open(event: Event, list: string, data: any = null) {
    event.preventDefault();

    this.#service.openTradeRequest(this.#injector, data).subscribe((value) => {
      // if (value) {
      //   if (list === 'out') {
      //     this.listOut = this.listOut.map((item) => {
      //       if (item.id === data.id) {
      //         return { ...item, price: value.price, amount: value.amount };
      //       }
      //
      //       return item;
      //     });
      //   } else {
      //     this.listEntry = this.listEntry.map((item) => {
      //       if (item.id === data.id) {
      //         return { ...item, price: value.price, amount: value.amount };
      //       }
      //
      //       return item;
      //     });
      //   }
      // }
    });
  }

  remove(event: Event, list: string, data: any): void {
    event.preventDefault();

    // if (list === 'out') {
    //   this.listOut = this.listOut.filter((item) => item.id !== data.id);
    // } else {
    //   this.listEntry = this.listEntry.filter((item) => item.id !== data.id);
    // }
  }

  private _updateControls(position: StockPosition): void {
    const direction = position.idea.positionType === 'long';
    let list = [];

    if (position.actions.entries && position.actions.entries.length === 0) {
      list = position.idea.entries.map((item) => ({
        price: item.price,
        quantity: item.quantity,
        total: item.totalPrice,
        direction,
        orderType: 1,
      }));
    } else {
      list = position.actions.entries.map((item) => ({
        ...item,
        price: item.price,
        quantity: item.amount,
        total: item.totalPrice,
        direction,
        orderType: 1,
      }));
    }

    this.formArrayEntry.clear();

    list.forEach((item, index: number) => {
      this.formArrayEntry.setControl(index, new FormControl(item));
    });
  }

  writeValue(obj: any): void {
    this.formGroup.patchValue(obj);
  }

  registerOnChange(fn: any): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formGroup[isDisabled ? 'disable' : 'enable']();
  }

  onRemoveOrder(event: Event, item: TradeOrder & { removed: boolean }): void {
    event.preventDefault();

    item['removed'] = true;

    const { account, source, instrument } = this.controlFilter.value;

    this.#store.removeOrder({
      accountId: account.accountId,
      orderId: item.orderId,
      sourceId: source.id,
      instrumentId: instrument.id,
    });
  }
}
