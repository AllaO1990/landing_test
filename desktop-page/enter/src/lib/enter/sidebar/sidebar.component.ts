import { TuiSelectModule, TuiTextareaModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiGroup, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { InstrumentComponent } from '../instrument/instrument.component';
import { ValidDateComponent } from './valid-date/valid-date.component';
import { TuiBlock, TuiDataListWrapperComponent, TuiFilter } from '@taiga-ui/kit';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';
import { SIDEBAR_CONSTANTS } from './sidebar.constants';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { Position } from 'types/position';
import { AccountFacade } from 'stores/facades/account.facade';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  Observable,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { AccountCurrency, AccountPortfolio, AccountStrategies } from 'types/account';
import { map } from 'rxjs/operators';
import { PortfolioComponent } from '../portfolio';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StockInstrument } from 'types/stock';

type Item = { id: string; name: string };
type StrategyItem = { id: string[]; name: string };

@Component({
  selector: 'lib-enter-sidebar',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    InstrumentComponent,
    ValidDateComponent,
    AsyncPipe,
    TuiFilter,
    TuiButton,
    TuiIcon,
    TuiTextareaModule,
    TuiScrollbar,
    TuiFormatNumberPipe,
    TuiGroup,
    TuiBlock,
    NgForOf,
    TuiDataListWrapperComponent,
    TuiSelectModule,
    PortfolioComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterSidebarComponent implements AfterViewInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _accountStore: AccountFacade = inject(AccountFacade);
  private _data: Position | null = null;

  readonly strategy: StrategyItem[] = STOCK_STRATEGY_LIST;
  readonly positionType: Item[] = STOCK_POSITION_TYPE_LIST;
  readonly constants = SIDEBAR_CONSTANTS;

  readonly instrument$: Subject<null | StockInstrument> = new BehaviorSubject<null | StockInstrument>(null);
  readonly strategies$: Observable<null | AccountStrategies[]> = this._accountStore.strategies$;
  readonly currencies$: Observable<null | AccountCurrency[]> = this._accountStore.currencies$
    .pipe
    // takeUntilDestroyed(this._destroyRef),
    // tap((list: AccountCurrency[] | null) => {
    //   if (list !== null && this.formControlCurrency.value === null) {
    //     this.formControlCurrency.patchValue(list[0], { emitEvent: true });
    //   }
    // })
    ();

  readonly size = 's';

  readonly form: FormGroup = new FormGroup({
    currencyId: new FormControl({ value: null, disabled: true }),
    portfolioId: new FormControl({ value: null, disabled: true }, Validators.required),
    parentId: new FormControl({ value: null, disabled: true }, Validators.required),
    instrumentId: new FormControl({ value: null, disabled: true }, Validators.required),
    expirationDate: new FormControl({ value: null, disabled: true }),
    strategyId: new FormControl({ value: null, disabled: true }),
    positionType: new FormControl({ value: 'long', disabled: true }),
    comment: new FormControl({ value: '', disabled: true }),
    watch: new FormControl(true),
  });

  get controlPortfolio(): FormControl {
    return this.form.get('portfolioId') as FormControl;
  }

  get controlPositionType(): FormControl {
    return this.form.get('positionType') as FormControl;
  }

  get controlStrategy(): FormControl {
    return this.form.get('strategyId') as FormControl;
  }

  get controlCurrency(): FormControl {
    return this.form.get('currencyId') as FormControl;
  }

  get controlInstrument(): FormControl {
    return this.form.get('instrumentId') as FormControl;
  }

  get controlParent(): FormControl {
    return this.form.get('parentId') as FormControl;
  }

  readonly formControlPortfolio = new FormControl({ value: null, disabled: true }, Validators.required);
  readonly formControlCurrency = new FormControl<AccountCurrency | null>(
    {
      value: null,
      disabled: true,
    },
    Validators.required
  );
  readonly formControlStrategy = new FormControl<null | StrategyItem>(
    {
      value: null,
      disabled: true,
    },
    Validators.required
  );

  @Input()
  set data(value: { type: string; data: Position } | null) {
    const action = value && value.type === 'instrument' ? 'enable' : 'disable';

    this.form[action]();
    this.formControlPortfolio[action]();

    if (value && value.data) {
      this._data = value.data;
      this.instrument$.next(value.data.instrument);
      this.controlParent.patchValue(value.data.id ? +value.data.id : null);
      this.controlPositionType.patchValue(value.data.positionType || null);
      this.controlInstrument.patchValue(value.data.instrument.id);

      const strategy =
        this.strategy.find((item: { id: string[] }) => item.id.includes(value.data.strategy.type)) || null;

      this.formControlStrategy.patchValue(strategy);
    }
  }

  @Output() selected: Observable<any> = this.form.valueChanges.pipe(debounceTime(100));

  get value() {
    return this._data;
  }

  ngAfterViewInit(): void {
    this._init();
  }

  readonly stringifyCurrency: TuiStringHandler<AccountCurrency> = (item: AccountCurrency) => item.currencySymbol;

  private _init(): void {
    combineLatest([
      this.currencies$.pipe(
        filter((currencies: AccountCurrency[] | null): currencies is AccountCurrency[] => currencies !== null)
      ),
      this.instrument$.pipe(
        filter((instrument: StockInstrument | null): instrument is StockInstrument => instrument !== null)
      ),
    ])
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(([currencies, instrument]: [AccountCurrency[], StockInstrument]) => {
        const currency = currencies.find((item: AccountCurrency) => item.currency === instrument.currency) || null;

        if (!currencies && this.formControlCurrency.value === null) {
          this.formControlCurrency.patchValue(currencies[0]);
          return;
        }

        if (this.formControlCurrency.value === null) {
          this.formControlCurrency.patchValue(currency);
        }
      });

    this.formControlPortfolio.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        startWith(this.formControlPortfolio.value),
        filter((value: AccountPortfolio | null): value is AccountPortfolio => value !== null),
        distinctUntilChanged((a, b) => a.portfolioId === b.portfolioId)
      )
      .subscribe((result: AccountPortfolio) => {
        this.controlPortfolio.patchValue(result ? result.portfolioId : null);
      });

    this.formControlCurrency.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        startWith(this.formControlCurrency.value),
        filter((value: AccountCurrency | null): value is AccountCurrency => value !== null),
        distinctUntilChanged((a, b) => a.currencyId === b.currencyId)
      )
      .subscribe((result: AccountCurrency) => {
        this.controlCurrency.patchValue(result.currencyId);
      });

    this.strategies$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        filter((value: AccountStrategies[] | null): value is AccountStrategies[] => value !== null),
        switchMap((strategies: AccountStrategies[]) =>
          this.formControlStrategy.valueChanges.pipe(
            startWith(this.formControlStrategy.value),
            filter((value: StrategyItem | null): value is StrategyItem => value !== null),
            map((value: StrategyItem) => strategies.find((item: AccountStrategies) => item.key === value.id[0]) || null)
          )
        )
      )
      .subscribe((result: AccountStrategies | null) => this.controlStrategy.patchValue(result ? result.id : null));
  }
}
