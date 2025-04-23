import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { TuiButton, TuiFormatNumberPipe, tuiNumberFormatProvider } from '@taiga-ui/core';
import { PORTFOLIO_LIST_CONSTANTS } from './portfolio-list.constants';
import { PortfolioInfoEnum } from './portfolio-list.types';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { LoaderComponent } from '@ui/components/loader';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import {
  AccountBalance,
  AccountBroker,
  AccountCurrency,
  AccountPortfolio,
  AccountRange,
  AccountStrategy,
  AccountType,
} from 'types/account';
import { map } from 'rxjs/operators';
import { Params } from '@angular/router';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { CommissionComponent } from './commission/commission.component';
import { ChartComponent } from './chart/chart.component';
import { BalanceComponent } from './balance/balance.component';
import { ColorPriceDirective } from '@ui/components/price';

@Component({
  selector: 'portfolio-list',
  standalone: true,
  imports: [
    TuiButton,
    NgForOf,
    LoaderComponent,
    AsyncPipe,
    TuiFormatNumberPipe,
    NgIf,
    ChartComponent,
    ColorPriceDirective,
  ],
  templateUrl: './portfolio-list.component.html',
  styleUrl: './portfolio-list.component.scss',
  providers: [tuiNumberFormatProvider({ precision: 2, decimalMode: 'always' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioListComponent implements AfterViewInit {
  private readonly _service: PortfolioFacade = inject(PortfolioFacade);
  readonly #dialogService: DialogService = inject(DIALOG);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #injector: Injector = inject(Injector);
  readonly #isLoadInfo$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  readonly #today: Date = new Date(new Date().setUTCHours(0, 0, 0, 0));

  #dialogCommissionComponent: PolymorpheusComponent<CommissionComponent> | null = null;
  #dialogBalanceComponent: PolymorpheusComponent<BalanceComponent> | null = null;

  readonly portfolio$: Observable<AccountPortfolio> = this._service.portfolio$.pipe(
    filter((list: null | AccountPortfolio): list is AccountPortfolio => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly broker$: Observable<AccountBroker> = this._service.broker$.pipe(
    filter((list: null | AccountBroker): list is AccountBroker => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly type$: Observable<AccountType> = this._service.type$.pipe(
    filter((list: null | AccountType): list is AccountType => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly strategy$: Observable<AccountStrategy> = this._service.strategy$.pipe(
    filter((list: null | AccountStrategy): list is AccountStrategy => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly currency$: Observable<AccountCurrency> = this._service.currency$.pipe(
    filter((list: null | AccountCurrency): list is AccountCurrency => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly range$: Observable<AccountRange> = this._service.range$.pipe(
    filter((list: null | AccountRange): list is AccountRange => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly data$: Observable<null | AccountBalance> = this._service.balance$.pipe(
    tap(() => this.#isLoadInfo$.next(false))
  );

  readonly size = 's';
  readonly listFirst: PortfolioInfoEnum[] = [
    PortfolioInfoEnum.INCOME,
    PortfolioInfoEnum.EXPENCE,
    PortfolioInfoEnum.COMISSION,
    PortfolioInfoEnum.FIXED_PROFIT,
  ];
  readonly listSecond: PortfolioInfoEnum[] = [PortfolioInfoEnum.IN_POSITION, PortfolioInfoEnum.SPARE];
  readonly constants: { [key: string]: string } = PORTFOLIO_LIST_CONSTANTS;

  readonly isLoadInfo$: Observable<boolean> = this.#isLoadInfo$.asObservable().pipe(
    switchMap((isLoad: boolean) => {
      if (isLoad) {
        return of(true);
      }
      return timer(300).pipe(map(() => false));
    })
  );

  ngAfterViewInit(): void {
    const params$: Observable<Params> = combineLatest([
      this.broker$,
      this.currency$,
      this.portfolio$,
      this.type$,
      this.strategy$,
    ]).pipe(
      debounceTime(0),
      map((params: [AccountBroker, AccountCurrency, AccountPortfolio, AccountType, AccountStrategy]) => ({
        brokerId: params[0].brokerId,
        currencyId: params[1].currencyId,
        portfolioId: params[2].portfolioId,
        instrumentType: params[3].id,
        strategyId: params[4].id,
      })),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    combineLatest([params$, this.range$])
      .pipe(
        debounceTime(0),
        map(([params, range]: [Params, AccountRange]) => ({
          ...params,
          from: range.from,
          to: range.to,
        })),
        tap(() => this.#isLoadInfo$.next(true))
      )
      .subscribe((params: Params) => this._service.loadBalance(params));
  }

  private _openDialog(c: PolymorpheusComponent<any>, data: any = null, label: string | null = null): Observable<any> {
    return this.#dialogService
      .open(c, {
        appearance: 'dialog-block',
        data,
        label,
      })
      .pipe(takeUntilDestroyed(this.#destroyRef));
  }

  async openDialogCommission(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.#dialogCommissionComponent) {
      this.#dialogCommissionComponent = await import('./commission/commission.component')
        .then((m) => m.CommissionComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    this._openDialog(
      this.#dialogCommissionComponent as PolymorpheusComponent<CommissionComponent>,
      {},
      'Комиссии'
    ).subscribe();
  }

  async openDialogBalance(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.#dialogBalanceComponent) {
      this.#dialogBalanceComponent = await import('./balance/balance.component')
        .then((m) => m.BalanceComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    this._openDialog(
      this.#dialogBalanceComponent as PolymorpheusComponent<BalanceComponent>,
      {},
      'Депозит'
    ).subscribe();
  }
}
