import { WithQueue } from 'stores/core/with-queue.abstract';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';
import { PortfolioPosition } from 'types/portfolio';
import { StockId } from 'types/stock';
import { DataList, Response } from 'types/response';
import { AccountBalance, AccountBroker, AccountCurrency, AccountPortfolio, AccountRange } from 'types/account';

export interface PortfolioState {
  list: null | PortfolioPosition[];
  total: null | number;
  broker: null | AccountBroker;
  currency: null | AccountCurrency;
  portfolio: null | AccountPortfolio;
  toCurrency: null | AccountCurrency;
  range: null | AccountRange;
  balance: null | AccountBalance;
}

export class PortfolioStore extends WithQueue<PortfolioState> {
  readonly list$: Observable<PortfolioPosition[] | null> = this.select((state: PortfolioState) => state.list);
  readonly total$: Observable<number | null> = this.select((state: PortfolioState) => state.total);
  readonly portfolio$: Observable<null | AccountPortfolio> = this.select((state: PortfolioState) => state.portfolio);
  readonly broker$: Observable<AccountBroker | null> = this.select((state: PortfolioState) => state.broker);
  readonly currency$: Observable<null | AccountCurrency> = this.select((state: PortfolioState) => state.currency);
  readonly range$: Observable<null | AccountRange> = this.select((state: PortfolioState) => state.range);
  readonly balance$: Observable<null | AccountBalance> = this.select((state: PortfolioState) => state.balance);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      total: null,
      broker: null,
      currency: null,
      portfolio: null,
      toCurrency: null,
      range: null,
      balance: null,
    });
  }

  updateList = this.updater(
    (state: PortfolioState, list: PortfolioPosition[] | null): PortfolioState => ({
      ...state,
      list,
    })
  );

  updateTotal = this.updater(
    (state: PortfolioState, total: number | null): PortfolioState => ({
      ...state,
      total,
    })
  );

  updateBroker = this.updater(
    (state: PortfolioState, broker: null | AccountBroker): PortfolioState => ({
      ...state,
      broker,
    })
  );

  updateCurrency = this.updater(
    (state: PortfolioState, currency: null | AccountCurrency): PortfolioState => ({
      ...state,
      currency,
    })
  );

  updatePortfolio = this.updater(
    (state: PortfolioState, portfolio: null | AccountPortfolio): PortfolioState => ({
      ...state,
      portfolio,
    })
  );

  updateToCurrency = this.updater(
    (state: PortfolioState, toCurrency: null | AccountCurrency): PortfolioState => ({
      ...state,
      toCurrency,
    })
  );

  updateRange = this.updater(
    (state: PortfolioState, range: null | any): PortfolioState => ({
      ...state,
      range,
    })
  );

  readonly updateBalance = this.updater(
    (state: PortfolioState, balance: null | AccountBalance): PortfolioState => ({
      ...state,
      balance,
    })
  );

  selectItem(id: StockId): Observable<PortfolioPosition | null> {
    return this.select((state: PortfolioState) => {
      if (!state.list) {
        return null;
      }

      return state.list.find((item: PortfolioPosition) => item.ideaId === id) || null;
    });
  }

  readonly load = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api.getPortfolio(params).pipe(
          tap((result: DataList<PortfolioPosition> | null) => {
            this.updateList(result ? result.items : null);
            this.updateTotal(result ? result.total : null);
          })
        )
      )
    )
  );

  readonly loadBalance = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api
          .getAccountBalance(params)
          .pipe(tap((response: Response<AccountBalance>) => this.updateBalance(response.data)))
      )
    )
  );
}
