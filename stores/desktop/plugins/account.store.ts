import { ComponentStore } from '@ngrx/component-store';
import { Observable, shareReplay, switchMap, tap } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio, AccountStrategies } from 'types/account';
import { DesktopService } from '@desktop-data/desktop-data';
import { DataList, Response } from 'types/response';
import { sortText } from 'utils/sort-text';

export interface AccountState {
  brokers: null | AccountBroker[];
  brokersMap: Map<number | null, AccountBroker>;
  currencies: null | AccountCurrency[];
  portfolios: null | AccountPortfolio[];
  strategies: null | AccountStrategies[];
  strategiesMap: Map<string, AccountStrategies>;
}

export class AccountStore extends ComponentStore<AccountState> {
  readonly brokers$: Observable<null | AccountBroker[]> = this.select((state: AccountState) => state.brokers);
  readonly brokersMap$: Observable<Map<number | null, AccountBroker>> = this.select(
    (state: AccountState) => state.brokersMap
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  readonly currencies$: Observable<null | AccountCurrency[]> = this.select((state: AccountState) => state.currencies);
  readonly portfolios$: Observable<null | AccountPortfolio[]> = this.select((state: AccountState) => state.portfolios);
  readonly strategies$: Observable<null | AccountStrategies[]> = this.select((state: AccountState) => state.strategies);
  readonly strategiesMap$: Observable<Map<string, AccountStrategies>> = this.select(
    (state: AccountState) => state.strategiesMap
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  constructor(private readonly _api: DesktopService) {
    super({
      brokers: null,
      brokersMap: new Map(),
      currencies: null,
      portfolios: null,
      strategies: null,
      strategiesMap: new Map(),
    });
  }

  readonly updateBrokers = this.updater(
    (state: AccountState, brokers: null | AccountBroker[]): AccountState => ({
      ...state,
      brokers,
    })
  );

  readonly updateBrokersMap = this.updater((state: AccountState, brokers: null | AccountBroker[]): AccountState => {
    const map = new Map<number | null, AccountBroker>();

    if (brokers !== null) {
      brokers.forEach((item: AccountBroker) => {
        map.set(item.brokerId, item);
      });
    }

    return {
      ...state,
      brokersMap: map,
    };
  });

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

  readonly updateStrategies = this.updater(
    (state: AccountState, strategies: null | AccountStrategies[]): AccountState => ({
      ...state,
      strategies,
    })
  );

  readonly updateStrategiesMap = this.updater(
    (state: AccountState, strategiesMap: null | AccountStrategies[]): AccountState => {
      const map = new Map<string, AccountStrategies>();

      if (strategiesMap !== null) {
        strategiesMap.forEach((item: AccountStrategies) => {
          map.set(item.key, item);
        });
      }

      return {
        ...state,
        strategiesMap: map,
      };
    }
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
        this._api.getAccountBrokers({}).pipe(
          tap((response: Response<DataList<AccountBroker>>) => {
            this.updateBrokers(response.data.items.sort((a, b) => sortText(a.broker, b.broker)));
            this.updateBrokersMap(response.data.items);
          })
        )
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

  readonly loadStrategies = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap(() =>
        this._api.getAccountStrategies().pipe(
          tap((response: Response<DataList<AccountStrategies>>) => {
            this.updateStrategies(response.data.items);
            this.updateStrategiesMap(response.data.items);
          })
        )
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
