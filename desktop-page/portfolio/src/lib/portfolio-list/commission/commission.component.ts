import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe } from '@taiga-ui/core';
import { PortfolioListDialog } from '../dialog';
import { CommissionStore } from 'stores/plugins/commission.store';
import { DESKTOP_API } from 'tokens/desktop';
import { DesktopService } from '@desktop-data/desktop-data';
import { AccountFacade } from 'stores/facades/account.facade';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { BehaviorSubject, filter, Observable, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { RangeWithListComponent } from 'ui-common/lib/range-with-list/range-with-list.component';
import { map } from 'rxjs/operators';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommissionAddComponent } from './add/add.component';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { LoaderComponent } from '@ui/components/loader';
import { Params } from '@angular/router';
import { CommissionItem } from 'types/commission';

@Component({
  selector: 'lib-commission',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    TuiButton,
    AsyncPipe,
    NgForOf,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    RangeWithListComponent,
    DatePipe,
    ItemDirective,
    ListComponent,
    LoaderComponent,
    HeaderComponent,
    TuiFormatNumberPipe,
  ],
  templateUrl: './commission.component.html',
  styleUrls: ['../dialog.scss', './commission.component.scss'],
  providers: [
    {
      provide: CommissionStore,
      useFactory: (api: DesktopService) => new CommissionStore(api),
      deps: [DESKTOP_API],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommissionComponent extends PortfolioListDialog implements AfterViewInit {
  readonly #dialogService: DialogService = inject(DIALOG);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #injector: Injector = inject(Injector);
  readonly #service: AccountFacade = inject(AccountFacade);
  readonly #store: CommissionStore = inject(CommissionStore);
  readonly #filterValue$: Subject<Params> = new BehaviorSubject({});
  readonly list$ = this.#store.list$;
  readonly itemHeight = 28;
  readonly portfolios$: Observable<AccountPortfolio[]> = this.#service.portfolios$.pipe(
    filter((list: AccountPortfolio[] | null): list is AccountPortfolio[] => list !== null),
    map((list: AccountPortfolio[]) => [{ portfolio: 'Все', portfolioId: null }, ...list]),
    tap((list: AccountPortfolio[]) => this.controlPortfolio.patchValue(list[0])),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$.pipe(
    filter((list: AccountBroker[] | null): list is AccountBroker[] => list !== null),
    map((list: AccountBroker[]) => [{ broker: 'Все', brokerId: null }, ...list]),
    tap((list: AccountBroker[]) => this.controlBroker.patchValue(list[0])),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly currencies$: Observable<null | AccountCurrency[]> = this.#service.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [{ currency: 'Все', currencySymbol: 'Все', currencyId: null }, ...list]),
    tap((list: AccountCurrency[]) => this.controlCurrency.patchValue(list[0])),
    shareReplay({ bufferSize: 1, refCount: true })
  );
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

  readonly form: FormGroup = new FormGroup({
    range: new FormControl(this.rangeList[3].range),
    broker: new FormControl(null),
    currency: new FormControl(null),
    portfolio: new FormControl(null),
  });

  get controlBroker(): FormControl {
    return this.form.get('broker') as FormControl;
  }

  get controlCurrency(): FormControl {
    return this.form.get('currency') as FormControl;
  }

  get controlPortfolio(): FormControl {
    return this.form.get('portfolio') as FormControl;
  }

  readonly isDisabled$: Observable<boolean> = this.form.valueChanges.pipe(
    startWith(this.form.value),
    switchMap((_: Params) =>
      this.#filterValue$
        .asObservable()
        .pipe(map((filter: Params) => JSON.stringify(this._getParams()) === JSON.stringify(filter)))
    )
  );

  #dialogAddComponent: PolymorpheusComponent<CommissionAddComponent> | null = null;

  ngAfterViewInit(): void {
    this._onLoadList();
    this.#filterValue$.next(this._getParams());
  }

  async openDialogAdd(event: Event, value: any | null = null): Promise<void> {
    event.preventDefault();

    if (!this.#dialogAddComponent) {
      this.#dialogAddComponent = await import('./add/add.component')
        .then((m) => m.CommissionAddComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    const data = value !== null ? value : this.form.value;

    this._openDialog(
      this.#dialogAddComponent as PolymorpheusComponent<CommissionAddComponent>,
      data,
      'Ввести комиссию'
    ).subscribe((res) => console.log(res));
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    this._onLoadList();
    this.#filterValue$.next(this._getParams());
  }

  onEdit(event: Event, item: CommissionItem): void {
    this.openDialogAdd(event);
  }

  protected selectRangeHandler = (item: { text: string; range: TuiDayRange }) => item.range;

  private _getStartDate(start: number): Date {
    const date = new Date(this.today);
    return new Date(date.setDate(date.getDate() + start));
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

  private _onLoadList(): void {
    this.#store.load(this._getParams());
  }

  private _getParams(): Params {
    const { range, portfolio, broker, currency } = this.form.value;
    let from: string | null = null;
    let to: string | null = null;
    let portfolioId: number | null = null;
    let brokerId: number | null = null;
    let currencyId: number | null = null;

    if (range !== null) {
      from = (range.from as TuiDay).toLocalNativeDate().toISOString();
      to = (range.to as TuiDay).toLocalNativeDate().toISOString();
    }

    if (portfolio !== null && portfolio.portfolioId !== null) {
      portfolioId = portfolio.portfolioId;
    }

    if (broker !== null && broker.brokerId !== null) {
      brokerId = broker.brokerId;
    }

    if (currency !== null && currency.currencyId !== null) {
      currencyId = currency.currencyId;
    }

    return { brokerId, currencyId, portfolioId, from, to };
  }
}
