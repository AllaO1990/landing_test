import {
  TuiInputDateRangeModule,
  TuiSelectModule,
  TuiTextfieldControllerModule,
  TuiUnfinishedValidator,
} from '@taiga-ui/legacy';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import {
  TuiCalendarRange,
  TuiCheckbox,
  TuiChevron,
  TuiDataListDropdownManager,
  TuiDataListWrapper,
} from '@taiga-ui/kit';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { TuiBreakpointService, TuiButton, TuiDropdown, TuiGroup, TuiIcon } from '@taiga-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, Observable, shareReplay, startWith, tap } from 'rxjs';
import { FILTER_CONSTANTS } from './filter.constants';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RangeWithListComponent } from 'ui-common/lib/range-with-list/range-with-list.component';

interface SelectListItem {
  name: string;
  id: string;
}

@Component({
  selector: 'portfolio-filter',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    ReactiveFormsModule,
    AsyncPipe,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiDataListWrapper,
    NgTemplateOutlet,
    TuiButton,
    TuiDropdown,
    TuiChevron,
    TuiCheckbox,
    TuiInputDateRangeModule,
    TuiDataListDropdownManager,
    TuiDropdown,
    TuiUnfinishedValidator,
    TuiCalendarRange,
    TuiIcon,
    TuiGroup,
    RangeWithListComponent,
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
  readonly isMobile$: Observable<boolean> = this._breakpoint$.pipe(
    map((screen: string | null) => screen === 'mobile'),
    tap((isMobile: boolean) => !isMobile && (this.open = false))
  );
  readonly constants = FILTER_CONSTANTS;
  readonly size = 's';
  readonly today = new Date(new Date().setUTCHours(12, 0, 0, 0));
  readonly rangeList: { text: string; range: TuiDayRange }[] = [
    {
      text: '7',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(this._getStartDate(-7)),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: '30',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(this._getStartDate(-30)),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: '90',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(this._getStartDate(-90)),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: '365',
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
  label = false;

  readonly formGroup: FormGroup = new FormGroup({
    portfolio: new FormControl({ value: null, disabled: false }, Validators.required),
    broker: new FormControl({ value: null, disabled: false }, Validators.required),
    currency: new FormControl({ value: null, disabled: false }, Validators.required),
    toCurrency: new FormControl({ value: null, disabled: false }, Validators.required),
    range: new FormControl({ value: this.rangeList[3].range, disabled: false }, Validators.required),
  });

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

  readonly portfolios$: Observable<AccountPortfolio[]> = this._accountFacade.portfolios$.pipe(
    filter((list: AccountPortfolio[] | null): list is AccountPortfolio[] => list !== null),
    map((list: AccountPortfolio[]) => [{ portfolio: 'Все', portfolioId: null }, ...list]),
    tap((list: AccountPortfolio[]) => {
      if (list !== null && list.length > 0 && this.controlPortfolio.value === null) {
        this.controlPortfolio.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly broker$: Observable<null | AccountBroker[]> = this._accountFacade.brokers$.pipe(
    filter((list: AccountBroker[] | null): list is AccountBroker[] => list !== null),
    map((list: AccountBroker[]) => [{ broker: 'Все', brokerId: null }, ...list]),
    tap((list: null | AccountBroker[]) => {
      if (list !== null && list.length > 0 && this.controlBroker.value === null) {
        this.controlBroker.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly currency$: Observable<null | AccountCurrency[]> = this._accountFacade.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [{ currency: 'Все', currencySymbol: 'Все', currencyId: null }, ...list]),
    tap((list: null | AccountCurrency[]) => {
      if (list !== null && list.length > 0) {
        if (this.controlCurrency.value === null) {
          this.controlCurrency.patchValue(list[0]);
        }

        if (this.controlToCurrency.value === null) {
          this.controlToCurrency.patchValue(list[0]);
        }
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  open = false;

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
              from: value.from.toLocalNativeDate().toISOString(),
              to: value.to.toLocalNativeDate().toISOString(),
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
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.open = false;
  }

  selectRangeHandler = (item: { text: string; range: TuiDayRange }) => item.range;

  private _getStartDate(start: number): Date {
    const date = new Date(this.today);
    return new Date(date.setDate(date.getDate() + start));
  }
}
