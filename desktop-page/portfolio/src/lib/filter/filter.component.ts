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
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { TuiBreakpointService, TuiButton, TuiPopup, TuiScrollbar } from '@taiga-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, Observable, of, shareReplay, startWith, tap } from 'rxjs';
import { FILTER_CONSTANTS } from './filter.constants';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RangeWithListComponent } from 'ui-common/lib/range-with-list/range-with-list.component';
import { ChipComponent } from './chip/chip.component';

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
  readonly rangeList: { text: string; range: TuiDayRange }[] = [
    {
      text: 'Сегодня',
      range: new TuiDayRange(TuiDay.fromLocalNativeDate(this.today), TuiDay.fromLocalNativeDate(this.today)),
    },
    {
      text: '7 дней',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(this._getStartDate(-7)),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: '30 дней',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(this._getStartDate(-30)),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: '90 дней',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(this._getStartDate(-90)),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: '365 дней',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(new Date(new Date().setFullYear(this._getStartDate(-365).getFullYear(), 0, 1))),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: 'С Начала года',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(new Date(new Date().setFullYear(this.today.getFullYear(), 0, 1))),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
  ];
  valueDefaultPortfolio = { portfolio: 'Все', portfolioId: null };
  valueDefaultBroker = { broker: 'Все', brokerId: null };
  valueDefaultCurrency = { currency: 'Все', currencySymbol: 'Все', currencyId: null };

  protected readonly openFilter: WritableSignal<boolean> = signal(false);

  readonly formGroupDialog: FormGroup = new FormGroup({
    assets: new FormControl({ value: null, disabled: true }, Validators.required),
    transaction: new FormControl({ value: null, disabled: true }, Validators.required),
    strategy: new FormControl({ value: null, disabled: true }, Validators.required),
    portfolio: new FormControl({ value: this.valueDefaultPortfolio, disabled: false }, Validators.required),
    broker: new FormControl({ value: this.valueDefaultBroker, disabled: false }, Validators.required),
    currency: new FormControl({ value: this.valueDefaultCurrency, disabled: false }, Validators.required),
    toCurrency: new FormControl({ value: this.valueDefaultCurrency, disabled: false }, Validators.required),
    range: new FormControl({ value: this.rangeList[5].range, disabled: false }, Validators.required),
  });

  readonly formGroup: FormGroup = new FormGroup({
    assets: new FormControl({ value: null, disabled: true }, Validators.required),
    transaction: new FormControl({ value: null, disabled: true }, Validators.required),
    strategy: new FormControl({ value: null, disabled: true }, Validators.required),
    portfolio: new FormControl({ value: this.valueDefaultPortfolio, disabled: false }, Validators.required),
    broker: new FormControl({ value: this.valueDefaultBroker, disabled: false }, Validators.required),
    currency: new FormControl({ value: this.valueDefaultCurrency, disabled: false }, Validators.required),
    toCurrency: new FormControl({ value: this.valueDefaultCurrency, disabled: false }, Validators.required),
    range: new FormControl({ value: this.rangeList[5].range, disabled: false }, Validators.required),
  });

  get controlAssets() {
    return this.formGroup.get('assets') as FormControl;
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

  get controlToCurrency() {
    return this.formGroup.get('toCurrency') as FormControl;
  }

  get controlRange() {
    return this.formGroup.get('range') as FormControl;
  }

  readonly assets$: Observable<any[]> = of([]).pipe(
    filter((list: any[] | null): list is any[] => list !== null),
    map((list: any[]) => [{ value: 'Все', id: null }, ...list]),
    tap((list: any[]) => {
      if (list !== null && list.length > 0 && this.controlAssets.value === null) {
        this.controlAssets.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

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

  readonly strategy$: Observable<any[]> = of([]).pipe(
    filter((list: any[] | null): list is any[] => list !== null),
    map((list: any[]) => [{ value: 'Все', id: null }, ...list]),
    tap((list: any[]) => {
      if (list !== null && list.length > 0 && this.controlStrategy.value === null) {
        this.controlStrategy.patchValue(list[0]);
      }
    }),
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
    this.portfolios$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
    this.broker$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
    this.currency$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe();

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

    this.controlBroker.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.controlBroker.value))
      .subscribe((value) => this._portfolioFacade.updateBroker(value));

    this.controlCurrency.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), startWith(this.controlCurrency.value))
      .subscribe((value) => this._portfolioFacade.updateCurrency(value));

    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value: any) => this.formGroupDialog.patchValue(value));
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
