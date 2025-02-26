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
import { TuiScrollbar } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { ValidDateComponent } from './valid-date/valid-date.component';
import { TuiBlock, TuiDataListWrapperComponent } from '@taiga-ui/kit';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';
import { SIDEBAR_CONSTANTS } from './sidebar.constants';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { StockPosition } from 'types/position';
import { AccountFacade } from 'stores/facades/account.facade';
import {
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
import { AccountCurrency, AccountPortfolio, AccountStrategies } from 'types/account';
import { ControlPortfolioComponent } from '../../../../../../ui-common/src/lib/portfolio';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IdeaFacade } from 'stores/facades/idea.facade';

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
    NgIf,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    ValidDateComponent,
    AsyncPipe,
    TuiTextareaModule,
    TuiScrollbar,
    TuiBlock,
    NgForOf,
    TuiDataListWrapperComponent,
    TuiSelectModule,
    ControlPortfolioComponent,
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

  private readonly _controlValue$: Subject<any | null> = new ReplaySubject(1);

  readonly strategies$: Observable<AccountStrategies[]> = this._accountStore.strategies$.pipe(
    filter((value: AccountStrategies[] | null): value is AccountStrategies[] => value !== null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly currencies$: Observable<AccountCurrency[]> = this._accountStore.currencies$.pipe(
    filter((currencies: AccountCurrency[] | null): currencies is AccountCurrency[] => currencies !== null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly portfolio$: Observable<AccountPortfolio[]> = this._accountStore.portfolios$.pipe(
    filter((portfolio: AccountPortfolio[] | null): portfolio is AccountPortfolio[] => portfolio !== null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly idea$: Observable<StockPosition> = this._idea.idea$.pipe(
    filter((position: StockPosition | null): position is StockPosition => position !== null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  isDisabled = false;
  value: any = null;

  onChange = (_: any) => {};
  onTouched = () => {};

  form: FormGroup = new FormGroup({
    positionType: new FormControl<null | string>(null),
    expirationDate: new FormControl<null | string>(null),
    strategyId: new FormControl<null | number>(null),
    portfolioId: new FormControl<null | number>(null),
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

  readonly formControlPortfolio: FormControl<AccountPortfolio | null> = new FormControl<AccountPortfolio | null>(
    null,
    Validators.required
  );
  readonly formControlCurrency: FormControl<AccountCurrency | null> = new FormControl<AccountCurrency | null>(
    { value: null, disabled: true },
    Validators.required
  );
  readonly formControlStrategy: FormControl<null | AccountStrategies> = new FormControl<null | AccountStrategies>(
    null,
    Validators.required
  );

  @Input({ required: true }) formGroup!: FormGroup;

  ngAfterViewInit(): void {
    this._init();
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
    this.formControlPortfolio[action]();
    this.formControlStrategy[action]();
  }

  readonly stringifyCurrency: TuiStringHandler<AccountCurrency> = (item: AccountCurrency) => item.currencySymbol;

  private _init(): void {
    this._controlValue$
      .asObservable()
      .pipe(debounceTime(100), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result === null) {
          this.form.reset({
            positionType: 'long',
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
            this.controlPortfolio.patchValue(portfolio.portfolioId, { onlySelf: true });
          }

          this.formControlStrategy.patchValue(strategyDefault || value, { emitEvent: false, onlySelf: true });
          this.formControlPortfolio.patchValue(portfolio, { emitEvent: false, onlySelf: true });
          this.formControlCurrency.patchValue(currency, { emitEvent: false, onlySelf: true });
        }
      );

    this.form.valueChanges.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((res: FormValue) => this.onChange(res));

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
      .subscribe((result: AccountStrategies | null) => {
        this.controlStrategy.patchValue(result ? result.id : null);
      });
  }

  private _getControlStrategyUser(): AccountStrategies {
    return this.strategy.find((item: AccountStrategies) => item.key === 'user') || this.strategy[0];
  }

  private _getControlStrategy(strategy: AccountStrategies | null): AccountStrategies | null {
    if (strategy === null) {
      return null;
    }

    return this.strategy.find((item: AccountStrategies) => strategy.key.indexOf(item.key) !== -1) || null;
  }

  private _getIdeaStrategy(list: AccountStrategies[], position: StockPosition): AccountStrategies | null {
    const strategy = position.idea.strategy;

    if (strategy === null) {
      return null;
    }

    return list.find((item: AccountStrategies) => item.key === strategy.type) || null;
  }
}
