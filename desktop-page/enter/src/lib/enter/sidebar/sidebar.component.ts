import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
  Input,
  OnDestroy,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';
import { SIDEBAR_CONSTANTS } from './sidebar.constants';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { StockPosition } from 'types/position';
import { AccountFacade } from 'stores/facades/account.facade';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  Observable,
  ReplaySubject,
  shareReplay,
  startWith,
  Subject,
} from 'rxjs';
import { AccountBalance, AccountCurrency, AccountPortfolio, AccountStrategy } from 'types/account';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { TuiButton, TuiDataList, TuiFormatNumberPipe, TuiScrollbar, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect, TuiTextarea } from '@taiga-ui/kit';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { ValidDateComponent } from './valid-date/valid-date.component';
import { ControlPortfolioComponent } from 'ui-common/lib/portfolio';
import { TuiAutoFocus, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { Params } from '@angular/router';
import { map } from 'rxjs/operators';
import { endOfMonth } from 'date-fns/endOfMonth';
import { BalanceDepositService } from 'ui-common/lib/dialog/balance-deposit';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { BalanceWithdrawalService } from 'ui-common/lib/dialog/balance-withdrawal';
import { triggerOpacityAnimations } from '@ui/animations/opacity.animations';

type Item = { id: string; name: string };

interface FormValue {
  positionType: null | string;
  expirationDate: null | string;
  strategyId: null | number;
  portfolioId: null | number;
  comment: string;
  instrumentId: null | number;
  parentId: null | number;
}

@Component({
  selector: 'lib-enter-sidebar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiTextarea,
    AsyncPipe,
    NgIf,
    TuiDataListWrapper,
    TuiSelect,
    TuiChevron,
    ValidDateComponent,
    ControlPortfolioComponent,
    TuiScrollbar,
    TuiTextfield,
    TuiDataList,
    NgForOf,
    TuiFormatNumberPipe,
    TuiButton,
    TuiAutoFocus,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EnterSidebarComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EnterSidebarComponent),
      multi: true,
    },
    {
      provide: BalanceDepositService,
      useFactory: (dialog: DialogService) => new BalanceDepositService(dialog),
      deps: [DIALOG],
    },
    {
      provide: BalanceWithdrawalService,
      useFactory: (dialog: DialogService) => new BalanceWithdrawalService(dialog),
      deps: [DIALOG],
    },
  ],
  animations: [triggerOpacityAnimations()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterSidebarComponent implements ControlValueAccessor, Validators, AfterViewInit, OnDestroy {
  readonly #injector: Injector = inject(Injector);
  readonly #balanceDepositService: BalanceDepositService = inject(BalanceDepositService);
  readonly #balanceWithdrawalService: BalanceWithdrawalService = inject(BalanceWithdrawalService);
  readonly #servicePortfolioFacade: PortfolioFacade = inject(PortfolioFacade);
  readonly #loadBalance$: Subject<void> = new BehaviorSubject<void>(void 0);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _idea: IdeaFacade = inject(IdeaFacade);
  private readonly _accountStore: AccountFacade = inject(AccountFacade);

  readonly strategy: AccountStrategy[] = STOCK_STRATEGY_LIST;
  readonly positionType: Item[] = STOCK_POSITION_TYPE_LIST;
  readonly constants = SIDEBAR_CONSTANTS;

  private readonly _controlValue$: Subject<any | null> = new ReplaySubject(1);

  readonly strategies$: Observable<AccountStrategy[]> = this._accountStore.strategies$.pipe(
    filter((value: AccountStrategy[] | null): value is AccountStrategy[] => value !== null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly currencies$: Observable<AccountCurrency[]> = this._accountStore.currencies$.pipe(
    filter((currencies: AccountCurrency[] | null): currencies is AccountCurrency[] => currencies !== null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly portfolio$: Observable<AccountPortfolio[]> = this._accountStore.portfolios$.pipe(
    filter((portfolio: AccountPortfolio[] | null): portfolio is AccountPortfolio[] => portfolio !== null),
    filter((portfolio: AccountPortfolio[]) => !!portfolio.length),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly idea$: Observable<StockPosition> = this._idea.idea$.pipe(
    filter((position: StockPosition | null): position is StockPosition => position !== null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly balance$: Observable<null | AccountBalance> = this.#servicePortfolioFacade.balance$.pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  isDisabled = false;
  value: any = null;

  onChange = (_: any) => {};
  onTouched = () => {};

  form: FormGroup = new FormGroup({
    author: new FormControl(null),
    positionType: new FormControl<null | string>(null, Validators.required),
    expirationDate: new FormControl<null | string>(null),
    strategyId: new FormControl<null | number>(null, Validators.required),
    portfolioId: new FormControl<null | number>(null, Validators.required),
    comment: new FormControl<string>(''),
    instrumentId: new FormControl<null | number>(null),
    parentId: new FormControl<null | number>(null),
  });

  readonly size = 's';

  get controlPortfolio(): FormControl {
    return this.form.get('portfolioId') as FormControl;
  }

  get controlStrategy(): FormControl {
    return this.form.get('strategyId') as FormControl;
  }

  get controlPositionType(): FormControl {
    return this.form.get('positionType') as FormControl;
  }

  get controlComment(): FormControl {
    return this.form.get('comment') as FormControl;
  }

  readonly formControlPortfolio: FormControl<AccountPortfolio | null> = new FormControl<AccountPortfolio | null>(
    null,
    Validators.required
  );
  readonly formControlCurrency: FormControl<AccountCurrency | null> = new FormControl<AccountCurrency | null>(
    { value: null, disabled: true },
    Validators.required
  );
  readonly formControlStrategy: FormControl<null | AccountStrategy> = new FormControl<null | AccountStrategy>(
    null,
    Validators.required
  );

  @Input({ required: true }) formGroup!: FormGroup;

  ngAfterViewInit(): void {
    this._init();

    combineLatest([
      this.controlPortfolio.valueChanges.pipe(
        filter((value: null | number): value is number => value !== null),
        distinctUntilChanged()
      ),
      this.#loadBalance$.asObservable(),
    ])
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map(([value]: [number, void]) => {
          const date = new Date();
          return {
            brokerId: null,
            currencyId: 1,
            from: new Date(new Date(date.getFullYear(), date.getMonth(), 1, 23).setUTCHours(0, 0, 0, 0)).toISOString(),
            instrumentType: 0,
            leadToCurrency: 'rub',
            portfolioId: value,
            strategyId: null,
            to: new Date(endOfMonth(new Date()).setUTCHours(23, 59, 59, 0)).toISOString(),
          };
        })
      )
      .subscribe((params: Params) => {
        this.#servicePortfolioFacade.loadBalance(params);
      });
  }

  ngOnDestroy(): void {
    this.#loadBalance$.complete();
  }

  writeValue(obj: any): void {
    this._controlValue$.next(obj);
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
    // this.formControlPortfolio[action]();
    this.formControlStrategy[action]();
    this.controlComment.enable();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (this.form.invalid) {
      return { sidebar: 'invalid' };
    }

    return null;
  }

  readonly stringifyCurrency = (item: AccountCurrency) => item.currencySymbol;
  readonly stringifyStrategy = (item: AccountStrategy) => item.name;

  @tuiPure
  stringifyPositionType(items: readonly Item[]): TuiStringHandler<string> {
    const map = new Map(items.map(({ name, id }) => [id, name] as [string, string]));

    return (d) => {
      return map.get(d) || '';
    };
  }

  readonly identityPositionType = (a: string, b: string) => {
    return a === b;
  };

  private _init(): void {
    this._controlValue$
      .asObservable()
      .pipe(debounceTime(100), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result === null) {
          this.form.reset({
            author: null,
            positionType: null,
            strategyId: 4,
            instrumentId: null,
            portfolioId: null,
            parentId: null,
            expirationDate: null,
            comment: '',
          });
        } else {
          const params: { [key: string]: any } = {};

          // if (result.portfolioId !== null) {
          //   this.controlPortfolio.patchValue(result.portfolioId, { onlySelf: true });
          // } else {
          params['portfolioId'] = this.controlPortfolio.value;
          // }
          //
          // if (result.strategyId !== null) {
          //   this.controlStrategy.patchValue(result.strategyId, { onlySelf: true });
          // } else {
          params['strategyId'] = this.controlStrategy.value;
          // }

          this.form.patchValue({ ...result, ...params });
        }

        setTimeout(() => {
          this.formGroup.markAsPristine();
        }, 100);
      });

    combineLatest([this.currencies$, this.strategies$, this.portfolio$, this.idea$])
      .pipe(takeUntilDestroyed(this._destroyRef), debounceTime(100))
      .subscribe(
        ([currencies, strategies, portfolios, position]: [
          AccountCurrency[],
          AccountStrategy[],
          AccountPortfolio[],
          StockPosition
        ]) => {
          const portfolio =
            portfolios.find((item: AccountPortfolio) => item.portfolioId === position.idea.portfolioId) ||
            portfolios[0];

          const currency =
            currencies.find((item: AccountCurrency) => item.currency === position.idea.instrument.currency) ||
            currencies[0];

          let value = this._getControlStrategyUser();
          const strategy = this._getIdeaStrategy(strategies, position);
          const strategyDefault = this._getControlStrategy(strategy);

          if (strategy) {
            value = strategy;
          } else if (strategyDefault) {
            value = strategyDefault;
          }

          if (this.controlStrategy.value === null) {
            this.controlStrategy.patchValue(value.id);
          }

          this.controlPositionType.patchValue(position.idea.positionType, { onlySelf: true });

          if (this.controlPortfolio.value === null) {
            this.controlPortfolio.patchValue(portfolio.portfolioId, { onlySelf: false });
          }

          this.formControlStrategy.patchValue(strategyDefault || value, { emitEvent: false, onlySelf: true });
          this.formControlPortfolio.patchValue(portfolio, { emitEvent: false, onlySelf: true });
          this.formControlCurrency.patchValue(currency, { emitEvent: false, onlySelf: true });
        }
      );

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((_: FormValue) => this.onChange(this.form.getRawValue()));

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

    this.formControlStrategy.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result: AccountStrategy | null) => {
        this.controlStrategy.patchValue(result ? result.id : null);
      });
  }

  private _getControlStrategyUser(): AccountStrategy {
    return this.strategy.find((item: AccountStrategy) => item.key === 'user') || this.strategy[0];
  }

  private _getControlStrategy(strategy: AccountStrategy | null): AccountStrategy | null {
    if (strategy === null) {
      return null;
    }

    return this.strategy.find((item: AccountStrategy) => strategy.key.indexOf(item.key) !== -1) || null;
  }

  private _getIdeaStrategy(list: AccountStrategy[], position: StockPosition): AccountStrategy | null {
    const strategy = position.idea.strategy;

    if (strategy === null) {
      return null;
    }

    return list.find((item: AccountStrategy) => item.key === strategy.type) || null;
  }

  openDialogDeposit(event: Event): void {
    event.preventDefault();

    this.#balanceDepositService
      .openDialog(this.#injector, {
        data: {
          type: 'deposit',
          portfolio: this.formControlPortfolio.value,
          currency: this.formControlCurrency.value,
        },
        max: null,
        label: 'Внести средства',
        action: 'Пополнить',
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => {
        if (value) {
          this.#loadBalance$.next();
        }
        console.log(value);
      });
  }

  openDialogExpense(event: Event): void {
    event.preventDefault();

    this.#balanceWithdrawalService
      .openDialog(this.#injector, {
        max: true,
        label: 'Вывести средства',
        data: {
          type: 'deposit',
          portfolio: this.formControlPortfolio.value,
          currency: this.formControlCurrency.value,
        },
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => {
        if (value) {
          this.#loadBalance$.next();
        }
      });
  }
}
