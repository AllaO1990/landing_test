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
import { StockPosition, StockPositionActionTarget, StockPositionTarget } from 'types/position';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeStore } from '../common/store';
import { Params } from '@angular/router';
import { DirectionTypePipe } from '../common/direction-type.pipe';
import { OrderTypePipe } from '../common/order-type.pipe';
import { TradeOrder } from '../common/api.types';
import { getNumberPrecision } from 'utils/get-number-precision';

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
    out: new FormArray([]),
  });

  get formArrayEntry(): FormArray {
    return this.formGroup.get('entry') as FormArray;
  }

  get formArrayOut(): FormArray {
    return this.formGroup.get('out') as FormArray;
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

  listOut$: Observable<ItemEntry[]> = timer(500).pipe(
    switchMap(() => this.formArrayOut.valueChanges.pipe(startWith(this.formArrayOut.value)))
  );

  ngAfterViewInit(): void {
    this.#store.loadSources();
    this.#store.loadOrderTypes();

    this.idea$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((position: StockPosition) => {
      this.controlFilter.patchValue({
        instrument: position.idea.instrument,
      });

      this._updateControls(position);
    });

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
        distinctUntilChanged(this._distinct)
      )
      .subscribe((params: Params) => {
        this.#store.loadOrders(params);
        this.#store.loadOperations(params);
      });

    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.formGroup.value))
      .subscribe((value) => this.#onChange(value));
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

  private _distinct(
    a: { accountId: string; instrumentId: string; sourceId: string },
    b: { accountId: string; instrumentId: string; sourceId: string }
  ): boolean {
    return a.accountId !== b.accountId && a.instrumentId !== b.instrumentId && a.sourceId !== b.sourceId;
  }

  private _updateControls(position: StockPosition): void {
    const direction = position.idea.positionType === 'long';
    let entry = [];
    let out = [];

    console.log(position);

    if (position.actions.entries && position.actions.entries.length === 0) {
      entry = position.idea.entries.map((item) => ({
        price: item.price,
        quantity: item.quantity,
        total: item.totalPrice,
        direction,
        orderType: 1,
      }));
    } else {
      entry = position.actions.entries.map((item) => ({
        ...item,
        price: item.price,
        quantity: item.amount,
        total: item.totalPrice,
        direction,
        orderType: 1,
      }));
    }

    this.formArrayEntry.clear();

    entry.forEach((item, index: number) => {
      this.formArrayEntry.setControl(index, new FormControl(item));
    });

    if (position.actions.outs && position.actions.outs.length > 0) {
      out = position.actions.outs.map((item: StockPositionActionTarget) => ({
        price: item.price,
        quantity: item.amount,
        total: getNumberPrecision(item.price * item.amount, 2),
        direction: !direction,
        orderType: 1,
      }));
    } else {
      out = position.idea.targets.map((item: StockPositionTarget) => ({
        price: item.price,
        quantity: item.amount,
        total: getNumberPrecision(item.price * item.amount, 2),
        direction: !direction,
        orderType: 1,
      }));
    }

    this.formArrayOut.clear();

    out.forEach((item, index: number) => {
      this.formArrayOut.setControl(index, new FormControl(item));
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
