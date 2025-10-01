import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, forwardRef, inject } from '@angular/core';
import { TuiDataList, TuiFormatNumberPipe, TuiHint, TuiTextfield } from '@taiga-ui/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, JsonPipe, NgForOf, NgIf, UpperCasePipe } from '@angular/common';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  pairwise,
  startWith,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { LoaderComponent } from '@ui/components/loader';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeStore } from '../common/store';
import { TradeAccount, TradeAccounts, TradeOrders, TradeSource, TradeSources, TradeToken } from '../common/api.types';
import { TuiChip } from '@taiga-ui/kit';
import { StockInstrument, WithLastPrice } from 'types/stock';
import { TuiCurrencyPipe } from '@taiga-ui/addon-commerce';
import { Response } from 'types/response';
import { Params } from '@angular/router';
import { StockPosition } from 'types/position';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { TokenButtonComponent } from '../token-button/token-button.component';

interface Position {
  loading: boolean;
  quantity: number;
  currency: string;
  price: number;
  total: number;
}

@Component({
  selector: 'trade-filter',
  standalone: true,
  imports: [
    TuiTextfield,
    ReactiveFormsModule,
    TuiDataList,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    NgIf,
    AsyncPipe,
    LoaderComponent,
    NgForOf,
    TuiFormatNumberPipe,
    TuiCurrencyPipe,
    UpperCasePipe,
    JsonPipe,
    TuiChip,
    TuiHint,
    TokenButtonComponent,
    TuiTextfield,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements ControlValueAccessor, AfterViewInit {
  readonly #store: TradeStore = inject(TradeStore);
  readonly #idea: IdeaFacade = inject(IdeaFacade);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  #onChange = (_: any) => {};
  #onTouched = () => {};

  readonly size = 's';
  readonly idea$: Observable<StockPosition> = this.#idea.idea$;
  readonly accounts$: Observable<Response<TradeAccounts | null> | null> = this.#store.accounts$.pipe(
    filter((data: Response<TradeAccounts | null> | null): data is Response<TradeAccounts | null> => data !== null),
    tap((response: Response<TradeAccounts | null>) => this.controlAccount.setValue(response.data && response.data[0]))
  );
  readonly token$: Observable<Response<TradeToken | null> | null> = this.#store.token$;
  readonly sources$: Observable<TradeSources> = this.#store.source$.pipe(
    filter((data: TradeSources | null): data is TradeSources => data !== null)
  );
  readonly formGroup: FormGroup = new FormGroup({
    instrument: new FormControl<StockInstrument | null>(null),
    source: new FormControl<TradeSource | null>(null),
    token: new FormControl<TradeToken | null>(null),
    account: new FormControl<TradeAccount | null>(null),
    lastPrice: new FormControl<WithLastPrice | null>(null),
  });

  get controlInstrument(): FormControl {
    return this.formGroup.get('instrument') as FormControl;
  }

  get controlSource(): FormControl {
    return this.formGroup.get('source') as FormControl;
  }

  get controlToken(): FormControl {
    return this.formGroup.get('token') as FormControl;
  }

  get controlAccount(): FormControl {
    return this.formGroup.get('account') as FormControl;
  }

  get controlLastPrice(): FormControl {
    return this.formGroup.get('lastPrice') as FormControl;
  }

  readonly stringifySource: TuiStringHandler<TradeSource> = (item: TradeSource) => item.name;

  isDisabled = false;

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
    if (this.isDisabled !== isDisabled) {
      this.formGroup[isDisabled ? 'disable' : 'enable']();
    }

    this.isDisabled = isDisabled;
  }

  ngAfterViewInit(): void {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.formGroup.value))
      .subscribe((value) => {
        this.#onChange(value);
      });

    this.#store.loadSources();

    this.idea$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        distinctUntilChanged((a, b) => a.idea.id === b.idea.id)
      )
      .subscribe((position: StockPosition) => this.controlInstrument.patchValue(position.idea.instrument));

    this.#idea.lastPrice$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        distinctUntilChanged((a: WithLastPrice | null, b: WithLastPrice | null) => !!(a && b && a.last === b.last))
      )
      .subscribe((value: null | WithLastPrice) => this.controlLastPrice.patchValue(value));

    this.#idea.loadLastPrice(
      this.#idea.instrument$.pipe(
        takeUntilDestroyed(this.#destroyRef),
        switchMap((instrument: StockInstrument | null) => {
          if (instrument === null) {
            return of(null);
          }

          return timer(0, this.#store.TIMER).pipe(
            takeUntilDestroyed(this.#destroyRef),
            map(() => instrument.id)
          );
        })
      )
    );

    combineLatest([
      this.formGroup.valueChanges.pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.formGroup.value),
        map((value) => ({
          sourceId: value.source && value.source.id,
          accountId: value.account && value.account.accountId,
          instrumentId: value.instrument && value.instrument.id,
        })),
        filter((value) => value.accountId !== null && value.instrumentId !== null && value.sourceId !== null),
        distinctUntilChanged(this._distinct)
      ),
      this.#store.orders$.pipe(filter((orders: TradeOrders | null) => orders !== null)),
    ])
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        map(([value]) => value)
      )
      .subscribe((params: Params) => {
        this.#store.loadPortfolio(params);
      });

    this.controlSource.valueChanges
      .pipe(
        startWith(this.controlSource.value),
        takeUntilDestroyed(this.#destroyRef),
        filter((value: TradeSource | null): value is TradeSource => value !== null),
        map((value: TradeSource) => value.id),
        distinctUntilChanged()
      )
      .subscribe((id: number) => {
        this.#store.loadToken(id);
      });

    this.sources$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        filter((list: TradeSources) => list && list.length > 0),
        take(1)
      )
      .subscribe((list: TradeSources) => this.controlSource.setValue(list[0]));

    this.token$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        pairwise(),
        map(([first, second]: [Response<TradeToken | null> | null, Response<TradeToken | null> | null]) => {
          if ((first !== null && second === null) || (second && second.data === null)) {
            this.#store.updateAccounts({
              data: null,
              message: 'Не добавлен токен источника tinkoff',
              success: true,
            });
          }

          if ((first === null || first.data === null) && second !== null && second.data !== null) {
            this.#store.loadAccounts(second.data.sourceId);
          }
          return second;
        })
      )
      .subscribe((value: Response<TradeToken | null> | null) => this.controlToken.setValue(value && value.data));
  }

  trackByIndex(index: number): number {
    return index;
  }

  private _distinct(
    a: { accountId: string; instrumentId: string; sourceId: string },
    b: { accountId: string; instrumentId: string; sourceId: string }
  ): boolean {
    return a.accountId === b.accountId && a.instrumentId === b.instrumentId && a.sourceId === b.sourceId;
  }
}
