import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlPortfolioComponent } from 'ui-common/lib/portfolio';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderComponent } from '@ui/components/loader';
import { TuiAutoFocus, TuiContext, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { TuiButton, TuiFormatNumberPipe, TuiNumberFormat, TuiTextfield } from '@taiga-ui/core';
import { DesktopService } from '@desktop-data/desktop-data';
import { DESKTOP_API } from 'tokens/desktop';
import { AccountFacade } from 'stores/facades/account.facade';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  forkJoin,
  Observable,
  shareReplay,
  Subject,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Params } from '@angular/router';
import { Response } from 'types/response';
import { PortfolioListDialog } from '../dialog';
import { stringifyBroker, stringifyCurrency } from '../utils';
import { TuiSelectModule, TuiTextareaModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiInputNumberDirective } from '@taiga-ui/kit';

@Component({
  selector: 'lib-withdrawal',
  standalone: true,
  imports: [
    CommonModule,
    ControlPortfolioComponent,
    FormsModule,
    LoaderComponent,
    ReactiveFormsModule,
    TuiAutoFocus,
    TuiButton,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiFormatNumberPipe,
    TuiNumberFormat,
    TuiTextareaModule,
    TuiInputNumberDirective,
    TuiTextfield,
  ],
  templateUrl: './withdrawal.component.html',
  styleUrls: ['../dialog.scss', './withdrawal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithdrawalComponent extends PortfolioListDialog {
  readonly #api: DesktopService = inject(DESKTOP_API);
  readonly #service: AccountFacade = inject(AccountFacade);
  readonly #updateBalance$: Subject<void> = new BehaviorSubject<void>(undefined);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  readonly portfolios$: Observable<null | AccountPortfolio[]> = this.#service.portfolios$;
  readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$;
  readonly currencies$: Observable<null | AccountCurrency[]> = this.#service.currencies$;

  readonly form: FormGroup = new FormGroup({
    amount: new FormControl(null, [Validators.required, Validators.min(0.01)]),
    brokerId: new FormControl(null, [Validators.required]),
    currencyId: new FormControl(null, [Validators.required]),
    portfolio: new FormControl(null, [Validators.required]),
    comment: new FormControl({ value: null, disabled: true }),
  });

  get controlBroker(): FormControl {
    return this.form.get('brokerId') as FormControl;
  }

  get controlCurrency(): FormControl {
    return this.form.get('currencyId') as FormControl;
  }

  get controlPortfolio(): FormControl {
    return this.form.get('portfolio') as FormControl;
  }

  @tuiPure
  get maxValue() {
    return this.context.data.max;
  }

  readonly getBalance = (params: Params) =>
    forkJoin([this.#api.getBalancePortfolioBrokerCurrency(params), timer(1000)]).pipe(
      map(([response, _]: [Response<any>, number]) => response.data)
    );

  readonly isLoadValue$: Subject<boolean> = new BehaviorSubject(false);
  readonly value$: Observable<any> = combineLatest([
    this.controlPortfolio.valueChanges.pipe(
      filter((value: null | any): value is any => value !== null),
      distinctUntilChanged()
    ),
    this.controlBroker.valueChanges.pipe(
      filter((value: null | any): value is any => value !== null),
      distinctUntilChanged()
    ),
    this.controlCurrency.valueChanges.pipe(
      filter((value: null | any): value is any => value !== null),
      distinctUntilChanged()
    ),
    this.#updateBalance$.asObservable(),
  ]).pipe(
    takeUntilDestroyed(this.#destroyRef),
    tap(() => this.isLoadValue$.next(true)),
    map(([portfolio, brokerId, currencyId]: any[]) => ({ brokerId, currencyId, portfolioId: portfolio.portfolioId })),
    switchMap((params: Params) => this.getBalance(params)),
    tap(() => this.isLoadValue$.next(false)),
    tap(() => this.form.patchValue({ amount: null })),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly balance$: Observable<null | number> = this.value$.pipe(map((value: { balance: number }) => value.balance));

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    const { portfolio, ...other } = this.form.value;
    const params = {
      ...other,
      portfolioId: portfolio.portfolioId,
    };

    this.#api
      .subToAccountDeposit(params)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((_) => this.#updateBalance$.next(undefined));

    this.form.patchValue({ amount: null });
  }

  @tuiPure
  protected stringifyBroker(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
    return stringifyBroker(items);
  }

  @tuiPure
  protected stringifyCurrency(items: readonly AccountCurrency[]): TuiStringHandler<TuiContext<number>> {
    return stringifyCurrency(items);
  }
}
