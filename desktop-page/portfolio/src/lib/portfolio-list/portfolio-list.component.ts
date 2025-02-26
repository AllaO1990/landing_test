import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { TuiButton, TuiFormatNumberPipe } from '@taiga-ui/core';
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
import { AccountBalance, AccountBroker, AccountCurrency, AccountPortfolio, AccountRange } from 'types/account';
import { map } from 'rxjs/operators';
import { Params } from '@angular/router';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { DepositComponent } from './deposit/deposit.component';
import { CommissionComponent } from './commission/commission.component';

@Component({
  selector: 'portfolio-list',
  standalone: true,
  imports: [TuiButton, NgForOf, LoaderComponent, AsyncPipe, TuiFormatNumberPipe, NgIf],
  templateUrl: './portfolio-list.component.html',
  styleUrl: './portfolio-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioListComponent implements AfterViewInit {
  private readonly _service: PortfolioFacade = inject(PortfolioFacade);
  readonly #dialogService: DialogService = inject(DIALOG);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #injector: Injector = inject(Injector);
  readonly #isLoadInfo$: Subject<boolean> = new BehaviorSubject<boolean>(false);

  #dialogDepositComponent: PolymorpheusComponent<DepositComponent> | null = null;
  #dialogCommissionComponent: PolymorpheusComponent<CommissionComponent> | null = null;

  readonly portfolio$: Observable<AccountPortfolio> = this._service.portfolio$.pipe(
    filter((list: null | AccountPortfolio): list is AccountPortfolio => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly broker$: Observable<AccountBroker> = this._service.broker$.pipe(
    filter((list: null | AccountBroker): list is AccountBroker => list !== null),
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
    combineLatest([this.broker$, this.currency$, this.range$, this.portfolio$])
      .pipe(
        debounceTime(0),
        map((params: [AccountBroker, AccountCurrency, AccountRange, AccountPortfolio]) => ({
          brokerId: params[0].brokerId,
          currencyId: params[1].currencyId,
          from: params[2].from,
          limit: 0,
          page: 0,
          portfolioId: params[3].portfolioId,
          to: params[2].to,
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

  async openDialogDeposit(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.#dialogDepositComponent) {
      this.#dialogDepositComponent = await import('./deposit/deposit.component')
        .then((m) => m.DepositComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    this._openDialog(
      this.#dialogDepositComponent as PolymorpheusComponent<DepositComponent>,
      {},
      'Внести средства'
    ).subscribe((res) => console.log(res));
  }

  async openDialogExpense(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.#dialogDepositComponent) {
      this.#dialogDepositComponent = await import('./deposit/deposit.component')
        .then((m) => m.DepositComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    this._openDialog(
      this.#dialogDepositComponent as PolymorpheusComponent<DepositComponent>,
      {},
      'Вывести средства'
    ).subscribe((res) => console.log(res));
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
      'Вывести комиссию'
    ).subscribe((res) => console.log(res));
  }
}
