import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, JsonPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { PortfolioListDialog } from '../dialog';
import { CommissionStore } from 'stores/plugins/commission.store';
import { DESKTOP_API } from 'tokens/desktop';
import { DesktopService } from '@desktop-data/desktop-data';
import { AccountFacade } from 'stores/facades/account.facade';
import { TuiContext, TuiDay, TuiDayRange, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { filter, Observable, shareReplay } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { RangeWithListComponent } from 'ui-common/lib/range-with-list/range-with-list.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'lib-commission',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    TuiButton,
    AsyncPipe,
    JsonPipe,
    NgForOf,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    RangeWithListComponent,
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
export class CommissionComponent extends PortfolioListDialog {
  readonly #service: AccountFacade = inject(AccountFacade);
  readonly #store: CommissionStore = inject(CommissionStore);
  readonly list$ = this.#store.list$;

  readonly portfolios$: Observable<AccountPortfolio[]> = this.#service.portfolios$.pipe(
    filter((list: AccountPortfolio[] | null): list is AccountPortfolio[] => list !== null),
    map((list: AccountPortfolio[]) => [{ portfolio: 'Все', portfolioId: null }, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$.pipe(
    filter((list: AccountBroker[] | null): list is AccountBroker[] => list !== null),
    map((list: AccountBroker[]) => [{ broker: 'Все', brokerId: null }, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly currencies$: Observable<null | AccountCurrency[]> = this.#service.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [{ currency: 'Все', currencySymbol: 'Все', currencyId: null }, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly max = TuiDay.fromLocalNativeDate(new Date());
  readonly form: FormGroup = new FormGroup({
    range: new FormControl(null),
    brokerId: new FormControl(null),
    currencyId: new FormControl(null),
    portfolio: new FormControl(null),
  });
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

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    const { range, portfolio, ...other } = this.form.value;

    console.log(range);

    this.#store.load({
      ...other,
      portfolioId: portfolio && portfolio.portfolioId,
    });
  }

  @tuiPure
  protected stringifyBroker(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
    const map = new Map(items.map(({ broker, brokerId }) => [brokerId, broker] as [number, string]));

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }

  @tuiPure
  protected stringifyCurrency(items: readonly AccountCurrency[]): TuiStringHandler<TuiContext<number>> {
    const map = new Map(
      items.map(({ currencySymbol, currencyId }) => [currencyId, currencySymbol] as [number, string])
    );

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }

  @tuiPure
  protected stringifyPortfolio(items: readonly AccountPortfolio[]): TuiStringHandler<TuiContext<number>> {
    const map = new Map(items.map(({ portfolio, portfolioId }) => [portfolioId, portfolio] as [number, string]));

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }

  protected selectRangeHandler = (item: { text: string; range: TuiDayRange }) => item.range;

  private _getStartDate(start: number): Date {
    const date = new Date(this.today);
    return new Date(date.setDate(date.getDate() + start));
  }
}
