import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
} from '@angular/core';
import { TuiButton, TuiDataList, TuiDialogService, TuiGroup, TuiTextfield } from '@taiga-ui/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, NgIf } from '@angular/common';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { distinctUntilChanged, filter, map, Observable, startWith, take } from 'rxjs';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { LoaderComponent } from '@ui/components/loader';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InstrumentComponent } from 'ui-common/lib/instrument/instrument.component';
import { TradeStore } from '../common/store';
import { TradeSource, TradeSources, TradeToken, TradeTokenSource } from '../common/api.types';
import { TradeDialogService } from '../dialog/dialog.service';
import { StockInstrument } from 'types/stock';
import { TUI_CONFIRM } from '@taiga-ui/kit';

interface FormValue {
  instrument: StockInstrument | null;
  source: TradeSource | null;
  token: TradeToken | null;
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
    InstrumentComponent,
    TuiButton,
    TuiGroup,
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
  readonly #dialogDefaultService: TuiDialogService = inject(TuiDialogService);
  readonly #injector: Injector = inject(Injector);
  readonly #dialog: TradeDialogService = inject(TradeDialogService);
  readonly #store: TradeStore = inject(TradeStore);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  #onChange = (_: any) => {};
  #onTouched = () => {};

  readonly size = 's';
  readonly token$: Observable<TradeToken | null> = this.#store.token$;
  readonly sources$: Observable<TradeSources> = this.#store.source$.pipe(
    filter((data: TradeSources | null): data is TradeSources => data !== null)
  );
  readonly formGroup: FormGroup = new FormGroup({
    instrument: new FormControl(null),
    source: new FormControl<TradeSource | null>(null),
    token: new FormControl<TradeToken | null>(null),
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

  readonly isDisabledToken$: Observable<boolean> = this.controlSource.valueChanges.pipe(
    map((value: null | TradeSource) => value === null),
    distinctUntilChanged()
  );
  readonly isDisabledRemoveToken$: Observable<boolean> = this.controlToken.valueChanges.pipe(
    map((value: null | TradeToken) => value === null),
    distinctUntilChanged()
  );
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
      .pipe(startWith(this.formGroup.value), takeUntilDestroyed(this.#destroyRef))
      .subscribe((value) => {
        this.#onChange(value);
      });

    this.controlSource.valueChanges
      .pipe(
        startWith(this.controlSource.value),
        takeUntilDestroyed(this.#destroyRef),
        filter((value: TradeSource | null): value is TradeSource => value !== null),
        map((value: TradeSource) => value.id),
        distinctUntilChanged()
      )
      .subscribe((id: number) => this.#store.loadToken(id));

    this.sources$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        filter((list: TradeSources) => list && list.length > 0),
        take(1)
      )
      .subscribe((list: TradeSources) => this.controlSource.setValue(list[0]));

    this.token$
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((value: TradeToken | null) => this.controlToken.setValue(value));
  }

  addToken(event: Event): void {
    event.preventDefault();

    this.#dialog
      .openTradeToken(this.#injector, this.formGroup.value)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((value: null | TradeTokenSource) => {
        if (value !== null) {
          this.#store.changeToken(value);
        }
      });
  }

  removeToken(event: Event): void {
    event.preventDefault();

    const { token } = this.formGroup.value;

    if (token) {
      this.#dialogDefaultService
        .open<boolean>(TUI_CONFIRM, {
          appearance: 'dialog-confirm',
          closeable: false,
          size: 'auto',
          data: {
            content: '<p class="tui-text_h6">Удалить токен?</p>',
            yes: 'Да',
            no: 'Нет',
          },
        })
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe((result: boolean) => {
          if (result) {
            this.#store.removeToken(token);
          }
        });
    }
  }
}
