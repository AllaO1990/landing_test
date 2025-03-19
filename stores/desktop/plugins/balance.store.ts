import { ComponentStore } from '@ngrx/component-store';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';
import { Response } from 'types/response';
import { AccountBalanceHistory, AccountBalanceHistoryItem } from 'types/account';

const DATA = [
  {
    id: 1,
    date: '2025-02-24T21:00:00Z',
    portfolio: {
      portfolioId: 4,
      portfolio: 'Swing',
    },
    broker: {
      brokerId: 1,
      broker: 'Т-инвестиции',
    },
    currency: {
      currencyId: 1,
      currency: 'rub',
      currencySymbol: '₽',
    },
    balance: 80,
  },
  {
    id: 3,
    date: '2025-03-03T11:38:53.119Z',
    portfolio: {
      portfolioId: 4,
      portfolio: 'Swing',
    },
    broker: {
      brokerId: 1,
      broker: 'Т-инвестиции',
    },
    currency: {
      currencyId: 1,
      currency: 'rub',
      currencySymbol: '₽',
    },
    balance: 20,
  },
  {
    id: 5,
    date: '2025-03-04T13:18:06.576Z',
    portfolio: {
      portfolioId: 4,
      portfolio: 'Swing',
    },
    broker: {
      brokerId: 1,
      broker: 'Т-инвестиции',
    },
    currency: {
      currencyId: 1,
      currency: 'rub',
      currencySymbol: '₽',
    },
    balance: 10,
  },
];

interface BalanceState {
  list: null | AccountBalanceHistoryItem[];
}

export class BalanceStore extends ComponentStore<BalanceState> {
  list$: Observable<AccountBalanceHistoryItem[] | null> = this.select((state) => state.list);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }

  readonly updateList = this.updater(
    (state: BalanceState, list: null | AccountBalanceHistoryItem[]): BalanceState => ({
      ...state,
      list,
    })
  );

  load = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) => this._api.getAccountBalanceHistory(params)),
      tap((response: Response<AccountBalanceHistory>) => this.updateList(DATA as any))
    )
  );
}
