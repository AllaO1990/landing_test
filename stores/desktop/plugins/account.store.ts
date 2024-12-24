import { ComponentStore } from '@ngrx/component-store';
import { Observable, switchMap, tap } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { DesktopService } from '@desktop-data/desktop-data';
import { DataList, Response } from 'types/response';

export interface AccountState {
  brokers: null | AccountBroker[];
  currencies: null | AccountCurrency[];
  portfolios: null | AccountPortfolio[];
}

export class AccountStore extends ComponentStore<AccountState> {
  readonly brokers$: Observable<null | AccountBroker[]> = this.select((state: AccountState) => state.brokers);
  readonly currencies$: Observable<null | AccountCurrency[]> = this.select((state: AccountState) => state.currencies);
  readonly portfolios$: Observable<null | AccountPortfolio[]> = this.select((state: AccountState) => state.portfolios);

  constructor(private readonly _api: DesktopService) {
    super({
      brokers: null,
      currencies: null,
      portfolios: null,
    });
  }

  readonly updateBrokers = this.updater(
    (state: AccountState, brokers: null | AccountBroker[]): AccountState => ({
      ...state,
      brokers,
    })
  );

  readonly updateCurrencies = this.updater(
    (state: AccountState, currencies: null | AccountCurrency[]): AccountState => ({
      ...state,
      currencies,
    })
  );

  readonly updatePortfolios = this.updater(
    (state: AccountState, portfolios: null | AccountPortfolio[]): AccountState => ({
      ...state,
      portfolios,
    })
  );

  readonly addPortfolio = this.updater((state: AccountState, portfolio: AccountPortfolio): AccountState => {
    const list: AccountPortfolio[] = state.portfolios !== null ? state.portfolios : [];

    return {
      ...state,
      portfolios: [portfolio, ...list],
    };
  });

  readonly changePortfolio = this.updater((state: AccountState, portfolio: AccountPortfolio): AccountState => {
    const list: AccountPortfolio[] = state.portfolios !== null ? state.portfolios : [];
    const findIndex = list.findIndex((item: AccountPortfolio) => item.portfolioId === portfolio.portfolioId);

    if (findIndex !== -1) {
      list[findIndex] = portfolio;
    }

    return {
      ...state,
      portfolios: [...list],
    };
  });

  readonly removePortfolio = this.updater((state: AccountState, portfolio: AccountPortfolio): AccountState => {
    const list: AccountPortfolio[] = state.portfolios !== null ? state.portfolios : [];

    return {
      ...state,
      portfolios: list.filter((item: AccountPortfolio) => item.portfolioId !== portfolio.portfolioId),
    };
  });

  readonly loadBrokers = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap(() =>
        this._api
          .getAccountBrokers({})
          .pipe(tap((response: Response<DataList<AccountBroker>>) => this.updateBrokers(response.data.items)))
      )
    )
  );

  readonly loadCurrencies = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap(() =>
        this._api
          .getAccountCurrencies({})
          .pipe(tap((response: Response<DataList<AccountCurrency>>) => this.updateCurrencies(response.data.items)))
      )
    )
  );

  readonly loadPortfolios = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap(() =>
        this._api
          .getAccountPortfolios({})
          .pipe(tap((response: Response<DataList<AccountPortfolio>>) => this.updatePortfolios(response.data.items)))
      )
    )
  );

  readonly createPortfolio = this.effect((stream$: Observable<string>) =>
    stream$.pipe(
      switchMap((name: string) =>
        this._api
          .createAccountPortfolio(name)
          .pipe(tap((response: Response<AccountPortfolio>) => this.addPortfolio(response.data)))
      )
    )
  );

  readonly editPortfolio = this.effect((stream$: Observable<AccountPortfolio>) =>
    stream$.pipe(
      switchMap((portfolio: AccountPortfolio) =>
        this._api
          .editAccountPortfolio(portfolio)
          .pipe(tap((response: Response<AccountPortfolio>) => this.changePortfolio(response.data)))
      )
    )
  );

  readonly deletePortfolio = this.effect((stream$: Observable<number>) =>
    stream$.pipe(
      switchMap((id: number) =>
        this._api
          .deleteAccountPortfolio(id)
          .pipe(tap((response: Response<AccountPortfolio>) => this.removePortfolio(response.data)))
      )
    )
  );
}
