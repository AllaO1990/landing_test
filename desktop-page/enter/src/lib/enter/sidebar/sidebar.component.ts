import { TuiSelectModule, TuiTextareaModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, forwardRef, inject } from '@angular/core';
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
import { tap } from 'rxjs/operators';

type Item = { id: string; name: string };

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

  isDisabled = false;
  value: any = null;

  onChange = (_: any) => {};
  onTouched = () => {};
  // form!: FormGroup;
  //
  // @Input() set formGroup(value: FormGroup) {
  //   this.form = value.get('idea') as FormGroup;
  //
  //   this.formControlPortfolio.enable();
  //   this.formControlStrategy.enable();
  // }
  form = new FormGroup({
    positionType: new FormControl<unknown>(null),
    expirationDate: new FormControl<unknown>(null),
    strategyId: new FormControl<unknown>(null),
    portfolioId: new FormControl<unknown>(null),
    comment: new FormControl(''),
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

  ngAfterViewInit(): void {
    this._init();
  }

  writeValue(obj: any): void {
    this.value = obj;

    if (obj === null) {
      // this.form.reset({ positionType: 'long', strategyId: 4, portfolioId: null, expirationDate: null, comment: '' });
    } else {
      // settings: {
      //   positionType: result.idea.positionType,
      //     strategyId: 4,
      //     instrumentId: result.idea.instrument.id,
      //     parentId: result.idea.parentId,
      //     portfolioId: result.idea.portfolioId,
      // },
      this.controlPortfolio.patchValue(obj.settings.portfolioId, { onlySelf: true });
      this.controlStrategy.patchValue(obj.settings.strategyId, { onlySelf: true });
      // this._updateFormArray('entries', obj.idea.entries, true);
      // this._updateFormArray('targets', obj.idea.targets, true);
      // this._updateFormArray('stop', obj.idea.stop, true);
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
  }

  readonly stringifyCurrency: TuiStringHandler<AccountCurrency> = (item: AccountCurrency) => item.currencySymbol;
  readonly stringifyPortfolio: TuiStringHandler<AccountPortfolio> = (item: AccountPortfolio) => item.portfolio;

  private _init(): void {
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

          if (this.controlStrategy.value === null) {
            this.controlStrategy.patchValue(strategy ? strategy.id : strategyDefault.id, { onlySelf: true });
          }
          this.controlPositionType.patchValue(position.idea.positionType, { onlySelf: true });
          if (this.controlPortfolio.value === null) {
            this.controlPortfolio.patchValue(portfolio.portfolioId, { onlySelf: true });
          }

          this.formControlStrategy.patchValue(strategyDefault, { emitEvent: false, onlySelf: true });
          this.formControlPortfolio.patchValue(portfolio, { emitEvent: false, onlySelf: true });
          this.formControlCurrency.patchValue(currency, { emitEvent: false, onlySelf: true });
        }
      );

    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        tap((data) => console.log(data))
      )
      .subscribe((res) => this.onChange({ ...(this.value || {}), settings: res }));

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

    // this.formControlCurrency.valueChanges
    //   .pipe(
    //     takeUntilDestroyed(this._destroyRef),
    //     startWith(this.formControlCurrency.value),
    //     filter((value: AccountCurrency | null): value is AccountCurrency => value !== null),
    //     distinctUntilChanged((a, b) => a.currencyId === b.currencyId)
    //   )
    //   .subscribe((result: AccountCurrency) => {
    //     if (this.controlCurrency) {
    //       this.controlCurrency.patchValue(result.currencyId);
    //     }
    //   });

    this.formControlStrategy.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
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
