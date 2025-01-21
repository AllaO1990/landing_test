import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiDataListWrapper } from '@taiga-ui/kit';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { TuiBreakpointService, TuiButton, TuiDropdown } from '@taiga-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, Observable, tap } from 'rxjs';
import { FILTER_CONSTANTS } from './filter.constants';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface SelectListItem {
  name: string;
  id: string;
}

type SelectList = SelectListItem[];

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
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements AfterViewInit {
  private readonly _accountFacade: AccountFacade = inject(AccountFacade);
  private readonly _portfolioFacade: PortfolioFacade = inject(PortfolioFacade);

  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);
  readonly isMobile$: Observable<boolean> = this._breakpoint$.pipe(
    map((screen: string | null) => screen === 'mobile'),
    tap((isMobile: boolean) => !isMobile && (this.open = false))
  );
  readonly constants = FILTER_CONSTANTS;
  readonly size = 's';

  readonly formGroup: FormGroup = new FormGroup({
    portfolio: new FormControl({ value: null, disabled: false }, Validators.required),
    broker: new FormControl({ value: null, disabled: false }, Validators.required),
    currency: new FormControl({ value: null, disabled: false }, Validators.required),
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

  readonly portfolios$: Observable<AccountPortfolio[]> = this._accountFacade.portfolios$.pipe(
    filter((list: AccountPortfolio[] | null): list is AccountPortfolio[] => list !== null),
    map((list: AccountPortfolio[]) => [{ portfolio: 'Все', portfolioId: null }, ...list]),
    tap((list: AccountPortfolio[]) => {
      if (list !== null && list.length > 0 && this.controlPortfolio.value === null) {
        this.controlPortfolio.patchValue(list[0]);
      }
    })
  );

  readonly broker$: Observable<null | AccountBroker[]> = this._accountFacade.brokers$.pipe(
    filter((list: AccountBroker[] | null): list is AccountBroker[] => list !== null),
    map((list: AccountBroker[]) => [{ broker: 'Все', brokerId: null }, ...list]),
    tap((list: null | AccountBroker[]) => {
      if (list !== null && list.length > 0 && this.controlBroker.value === null) {
        this.controlBroker.patchValue(list[0]);
      }
    })
  );

  readonly currency$: Observable<null | AccountCurrency[]> = this._accountFacade.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [{ currency: 'Все', currencySymbol: 'Все', currencyId: null }, ...list]),
    tap((list: null | AccountCurrency[]) => {
      if (list !== null && list.length > 0 && this.controlCurrency.value === null) {
        this.controlCurrency.patchValue(list[0]);
      }
    })
  );

  readonly stringify: TuiStringHandler<SelectListItem> = (item: SelectListItem) => item.name;

  open = false;

  ngAfterViewInit(): void {
    this.controlPortfolio.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => this._portfolioFacade.updatePortfolio(value));

    this.controlBroker.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => this._portfolioFacade.updateBroker(value));

    this.controlCurrency.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => this._portfolioFacade.updateCurrency(value));

    // timer(0)
    //   .pipe(
    //     takeUntilDestroyed(this._destroyRef),
    //     switchMap((_) => of(PORTFOLIO_LIST)),
    //     tap((list) => {
    //       this.controlPortfolio.enable({ emitEvent: false });
    //       this.controlPortfolio.patchValue(list[0]);
    //       this._cdr.markForCheck();
    //     })
    //   )
    //   .subscribe((res: SelectList) => this.portfolio$.next(res));
    // timer(1300)
    //   .pipe(
    //     takeUntilDestroyed(this._destroyRef),
    //     switchMap((_) => of(BROKER_LIST)),
    //     tap((list) => {
    //       this.controlBroker.enable({ emitEvent: false });
    //       this.controlBroker.patchValue(list[0]);
    //     })
    //   )
    //   .subscribe((res: SelectList) => this.broker$.next(res));
    // timer(900)
    //   .pipe(
    //     takeUntilDestroyed(this._destroyRef),
    //     switchMap((_) => of(CURRENCY_LIST)),
    //     tap((list) => {
    //       this.controlCurrency.enable({ emitEvent: false });
    //       this.controlCurrency.patchValue(list[0]);
    //     })
    //   )
    //   .subscribe((res: SelectList) => this.currency$.next(res));
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.open = false;
  }
}
