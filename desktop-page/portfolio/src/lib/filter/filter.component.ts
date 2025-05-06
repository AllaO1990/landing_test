import { TuiInputDateRangeModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiChip, TuiDataListWrapper, TuiDrawer } from '@taiga-ui/kit';
import { TuiDayRange } from '@taiga-ui/cdk';
import { TuiBreakpointService, TuiButton, TuiPopup, TuiScrollbar } from '@taiga-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, Observable, of, shareReplay, startWith, tap } from 'rxjs';
import { FILTER_CONSTANTS } from './filter.constants';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { AccountBroker, AccountCurrency, AccountPortfolio, AccountStrategy, AccountType } from 'types/account';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RangeWithListComponent } from 'ui-common/lib/range-with-list/range-with-list.component';
import { ChipComponent } from './chip/chip.component';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';
import { LocalStorage } from 'storage/local.storage';
import { getListOfRange } from 'utils/get-list-of-range';

@Component({
  selector: 'portfolio-filter',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    AsyncPipe,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiDataListWrapper,
    NgTemplateOutlet,
    TuiButton,
    TuiInputDateRangeModule,
    RangeWithListComponent,
    TuiDrawer,
    TuiPopup,
    TuiChip,
    TuiScrollbar,
    ChipComponent,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements AfterViewInit {
  readonly #localStorage: LocalStorage = inject(LOCAL_STORAGE);
  private readonly _accountFacade: AccountFacade = inject(AccountFacade);
  private readonly _portfolioFacade: PortfolioFacade = inject(PortfolioFacade);

  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);
  readonly isDesktop$: Observable<boolean> = this._breakpoint$.pipe(
    map((screen: string | null) => screen !== 'mobile'),
    tap((isDesktop: boolean) => isDesktop && this.openFilter.set(false)),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly isMobile$: Observable<boolean> = this.isDesktop$.pipe(
    map((isDesktop: boolean) => !isDesktop),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  readonly constants = FILTER_CONSTANTS;
  readonly size = 's';
  readonly today = new Date(new Date().setUTCHours(12, 0, 0, 0));
  readonly rangeList: { text: string; range: TuiDayRange }[] = getListOfRange(this.today);
  valueDefaultPortfolio = { portfolio: 'Все', portfolioId: null };
  valueDefaultBroker = { broker: 'Все', brokerId: null };
  valueDefaultCurrency = { currency: 'Все', currencySymbol: 'Все', currencyId: null };
  valueDefaultStrategy = { name: 'Все', key: 'all', id: null };
  valueDefaultType = { name: 'Все', key: 'all', id: null };
  valueDefault = {
    type: this.valueDefaultType,
    transaction: null,
    strategy: this.valueDefaultStrategy,
    portfolio: this.valueDefaultPortfolio,
    broker: this.valueDefaultBroker,
    currency: this.valueDefaultCurrency,
    leadToCurrency: this.valueDefaultCurrency,
    // range: this.rangeList[5].range,
  };

  protected readonly openFilter: WritableSignal<boolean> = signal(false);

  readonly formGroupDialog: FormGroup = new FormGroup({
    type: new FormControl({ value: this.valueDefaultType, disabled: false }, Validators.required),
    transaction: new FormControl({ value: null, disabled: true }, Validators.required),
    strategy: new FormControl({ value: this.valueDefaultStrategy, disabled: false }, Validators.required),
    portfolio: new FormControl({ value: this.valueDefaultPortfolio, disabled: false }, Validators.required),
    broker: new FormControl({ value: this.valueDefaultBroker, disabled: false }, Validators.required),
    currency: new FormControl({ value: this.valueDefaultCurrency, disabled: false }, Validators.required),
    leadToCurrency: new FormControl({ value: this.valueDefaultCurrency, disabled: false }, Validators.required),
    range: new FormControl({ value: this.rangeList[5].range, disabled: false }, Validators.required),
  });

  readonly formGroup: FormGroup = new FormGroup({
    type: new FormControl({ value: this.valueDefaultType, disabled: false }, Validators.required),
    transaction: new FormControl({ value: null, disabled: true }, Validators.required),
    strategy: new FormControl({ value: this.valueDefaultStrategy, disabled: false }, Validators.required),
    portfolio: new FormControl({ value: this.valueDefaultPortfolio, disabled: false }, Validators.required),
    broker: new FormControl({ value: this.valueDefaultBroker, disabled: false }, Validators.required),
    currency: new FormControl({ value: this.valueDefaultCurrency, disabled: false }, Validators.required),
    leadToCurrency: new FormControl({ value: this.valueDefaultCurrency, disabled: false }, Validators.required),
    range: new FormControl({ value: this.rangeList[5].range, disabled: false }, Validators.required),
  });

  get controlType() {
    return this.formGroup.get('type') as FormControl;
  }

  get controlTransaction() {
    return this.formGroup.get('transaction') as FormControl;
  }

  get controlStrategy() {
    return this.formGroup.get('strategy') as FormControl;
  }

  get controlPortfolio() {
    return this.formGroup.get('portfolio') as FormControl;
  }

  get controlBroker() {
    return this.formGroup.get('broker') as FormControl;
  }

  get controlCurrency() {
    return this.formGroup.get('currency') as FormControl;
  }

  get controlLeadToCurrency() {
    return this.formGroup.get('leadToCurrency') as FormControl;
  }

  get controlRange() {
    return this.formGroup.get('range') as FormControl;
  }

  // readonly assets$: Observable<AccountTypes[]> = this._accountFacade.types$.pipe(
  //   filter((list: AccountTypes[] | null): list is AccountTypes[] => list !== null),
  //   map((list: AccountTypes[]) => [this.valueDefaultType, ...list]),
  //   shareReplay({ bufferSize: 1, refCount: true })
  // );

  readonly transaction$: Observable<any[]> = of([]).pipe(
    filter((list: any[] | null): list is any[] => list !== null),
    map((list: any[]) => [{ value: 'Все', id: null }, ...list]),
    tap((list: any[]) => {
      if (list !== null && list.length > 0 && this.controlTransaction.value === null) {
        this.controlTransaction.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly strategy$: Observable<AccountStrategy[]> = this._accountFacade.strategies$.pipe(
    filter((list: AccountStrategy[] | null): list is AccountStrategy[] => list !== null),
    map((list: AccountStrategy[]) => [this.valueDefaultStrategy, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly types$: Observable<AccountType[]> = this._accountFacade.types$.pipe(
    filter((list: AccountType[] | null): list is AccountType[] => list !== null),
    map((list: AccountType[]) => [this.valueDefaultType, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly portfolios$: Observable<AccountPortfolio[]> = this._accountFacade.portfolios$.pipe(
    filter((list: AccountPortfolio[] | null): list is AccountPortfolio[] => list !== null),
    map((list: AccountPortfolio[]) => [this.valueDefaultPortfolio, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly broker$: Observable<null | AccountBroker[]> = this._accountFacade.brokers$.pipe(
    filter((list: AccountBroker[] | null): list is AccountBroker[] => list !== null),
    map((list: AccountBroker[]) => [this.valueDefaultBroker, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly currency$: Observable<null | AccountCurrency[]> = this._accountFacade.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [this.valueDefaultCurrency, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngAfterViewInit(): void {
    // this.portfolios$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
    // this.broker$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
    // this.currency$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
    // this.strategy$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe();

    const value = this.#localStorage.getItem('portfolioFilter') || this.valueDefault;

    this.formGroup.patchValue(value);
    this.formGroupDialog.patchValue(value);

    this.controlRange.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        startWith(this.controlRange.value),
        map(
          (value: null | TuiDayRange) =>
            value && {
              from: value.from.toUtcNativeDate().toISOString(),
              to: new Date(value.to.toUtcNativeDate().setUTCHours(23, 59, 59)).toISOString(),
            }
        )
      )
      .subscribe((value: null | { from: string; to: string }) => this._portfolioFacade.updateRange(value));

    this.controlPortfolio.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.controlPortfolio.value))
      .subscribe((value) => this._portfolioFacade.updatePortfolio(value));

    this.controlType.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.controlType.value))
      .subscribe((value) => this._portfolioFacade.updateType(value));

    this.controlBroker.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.controlBroker.value))
      .subscribe((value) => this._portfolioFacade.updateBroker(value));

    this.controlCurrency.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.controlCurrency.value))
      .subscribe((value) => this._portfolioFacade.updateCurrency(value));

    this.controlStrategy.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.controlStrategy.value))
      .subscribe((value) => this._portfolioFacade.updateStrategy(value));

    this.controlLeadToCurrency.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.controlLeadToCurrency.value))
      .subscribe((value) => this._portfolioFacade.updateLeadToCurrency(value));

    this.formGroup.valueChanges.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((value) => {
      const { range, ...other } = value;
      this.#localStorage.setItem('portfolioFilter', other);

      this.formGroupDialog.patchValue(value);
    });
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);
    this.formGroupDialog.patchValue(this.formGroup.value);
  }

  selectRangeHandler = (item: { text: string; range: TuiDayRange }) => item.range;

  private _getStartDate(start: number): Date {
    const date = new Date(this.today);
    return new Date(date.setDate(date.getDate() + start));
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    this.openFilter.set(false);
    this.formGroup.patchValue(this.formGroupDialog.value);
    this.formGroupDialog.markAsPristine();
  }
}
