import { TuiSelectModule, TuiTextareaModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Input,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiGroup, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { InstrumentComponent } from '../instrument/instrument.component';
import { ValidDateComponent } from './valid-date/valid-date.component';
import { TuiBlock, TuiDataListWrapperComponent, TuiFilter } from '@taiga-ui/kit';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';
import { SIDEBAR_CONSTANTS } from './sidebar.constants';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { StockPosition } from 'types/position';
import { AccountFacade } from 'stores/facades/account.facade';
import { combineLatest, debounceTime, distinctUntilChanged, filter, Observable, shareReplay, startWith } from 'rxjs';
import { AccountCurrency, AccountPortfolio, AccountStrategies } from 'types/account';
import { PortfolioComponent } from '../portfolio';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IdeaFacade } from 'stores/facades/idea.facade';

type Item = { id: string; name: string };
type FormControlValue = {
  currencyId: null | string;
  portfolioId: null | string;
  expirationDate: null | string;
  strategyId: null | string;
  positionType: null | string;
  comment: null | string;
};

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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EnterSidebarComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterSidebarComponent implements ControlValueAccessor, AfterViewInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _idea: IdeaFacade = inject(IdeaFacade);
  private readonly _accountStore: AccountFacade = inject(AccountFacade);

  readonly strategy: AccountStrategies[] = STOCK_STRATEGY_LIST;
  readonly positionType: Item[] = STOCK_POSITION_TYPE_LIST;
  readonly constants = SIDEBAR_CONSTANTS;

  readonly strategies$: Observable<AccountStrategies[]> = this._accountStore.strategies$.pipe(
    filter((value: AccountStrategies[] | null): value is AccountStrategies[] => value !== null)
  );
  readonly currencies$: Observable<AccountCurrency[]> = this._accountStore.currencies$.pipe(
    filter((currencies: AccountCurrency[] | null): currencies is AccountCurrency[] => currencies !== null)
  );
  readonly portfolio$: Observable<AccountPortfolio[]> = this._accountStore.portfolios$.pipe(
    filter((portfolio: AccountPortfolio[] | null): portfolio is AccountPortfolio[] => portfolio !== null)
  );

  readonly idea$: Observable<StockPosition> = this._idea.idea$.pipe(
    filter((position: StockPosition | null): position is StockPosition => position !== null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  form!: FormGroup;

  @Input() set formGroup(value: FormGroup) {
    console.log(value);

    this.form = value.get('idea') as FormGroup;

    this.formControlPortfolio.enable();
    this.formControlStrategy.enable();
  }

  readonly size = 's';
  isDisabled = true;
  onChange = (_: any) => {};
  onTouched = () => {};

  // readonly form: FormGroup = new FormGroup({
  //   currencyId: new FormControl({ value: null, disabled: true }),
  //   portfolioId: new FormControl({ value: null, disabled: true }, Validators.required),
  //   expirationDate: new FormControl({ value: null, disabled: true }),
  //   strategyId: new FormControl({ value: null, disabled: true }, Validators.required),
  //   positionType: new FormControl({ value: null, disabled: true }, Validators.required),
  //   comment: new FormControl({ value: '', disabled: true }),
  // });

  get controlPortfolio(): FormControl {
    return this.form.get('portfolioId') as FormControl;
  }

  get controlStrategy(): FormControl {
    return this.form.get('strategyId') as FormControl;
  }

  get controlCurrency(): FormControl {
    return this.form.get('currencyId') as FormControl;
  }

  readonly formControlPortfolio: FormControl<AccountPortfolio | null> = new FormControl<AccountPortfolio | null>(
    {
      value: null,
      disabled: true,
    },
    Validators.required
  );
  readonly formControlCurrency: FormControl<AccountCurrency | null> = new FormControl<AccountCurrency | null>(
    {
      value: null,
      disabled: true,
    },
    Validators.required
  );
  readonly formControlStrategy: FormControl<null | AccountStrategies> = new FormControl<null | AccountStrategies>(
    {
      value: null,
      disabled: true,
    },
    Validators.required
  );

  ngAfterViewInit(): void {
    this._init();
  }

  writeValue(obj: FormControlValue): void {
    console.log(obj);

    if (obj !== null) {
      this.form.patchValue(obj);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;

    const action = isDisabled ? 'disable' : 'enable';
    this.form[action]();
    this.formControlPortfolio[action]();
    this.formControlStrategy[action]();
  }

  readonly stringifyCurrency: TuiStringHandler<AccountCurrency> = (item: AccountCurrency) => item.currencySymbol;
  readonly stringifyPortfolio: TuiStringHandler<AccountPortfolio> = (item: AccountPortfolio) => item.portfolio;

  private _init(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), debounceTime(100))
      .subscribe((value) => this.onChange(value));

    combineLatest([this.currencies$, this.strategies$, this.portfolio$, this.idea$])
      .pipe(takeUntilDestroyed(this._destroyRef), debounceTime(100))
      .subscribe(
        ([currencies, strategies, portfolios, position]: [
          AccountCurrency[],
          AccountStrategies[],
          AccountPortfolio[],
          StockPosition
        ]) => {
          const portfolio =
            portfolios.find((item: AccountPortfolio) => item.portfolioId === position.idea.portfolioId) ||
            portfolios[0];

          const currency =
            currencies.find((item: AccountCurrency) => item.currency === position.idea.instrument.currency) ||
            currencies[0];

          const strategy = this._getIdeaStrategy(strategies, position);
          const strategyDefault = this._getControlStrategy(strategy);

          this.form.patchValue({
            ...this.form.value,
            positionType: position.idea.positionType,
            strategyId: strategy ? strategy.id : strategyDefault.id,
            currencyId: currency.currencyId,
            portfolioId: portfolio.portfolioId,
          });

          this.formControlStrategy.patchValue(strategyDefault, { emitEvent: false });
          this.formControlPortfolio.patchValue(portfolio, { emitEvent: false });
          this.formControlCurrency.patchValue(currency, { emitEvent: false });
        }
      );

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

    this.formControlStrategy.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.formControlStrategy.value))
      .subscribe((result: AccountStrategies | null) => this.controlStrategy.patchValue(result ? result.id : null));
  }

  private _getControlStrategy(strategy: AccountStrategies | null): AccountStrategies {
    const user = this.strategy.find((item: AccountStrategies) => item.key === 'user') || this.strategy[0];

    if (strategy === null) {
      return user;
    }

    return this.strategy.find((item: AccountStrategies) => strategy.key.indexOf(item.key) !== -1) || user;
  }

  private _getIdeaStrategy(list: AccountStrategies[], position: StockPosition): AccountStrategies | null {
    const strategy = position.idea.strategy;

    if (strategy === null) {
      return null;
    }

    return list.find((item: AccountStrategies) => item.key === strategy.type) || null;
  }
}
