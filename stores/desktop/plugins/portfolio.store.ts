import { WithQueue } from 'stores/core/with-queue.abstract';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';
import { PortfolioPosition } from 'types/portfolio';
import { StockId } from 'types/stock';
import { DataList, Response } from 'types/response';
import {
  AccountBalance,
  AccountBalanceHistory,
  AccountBalanceHistoryItem,
  AccountBroker,
  AccountCurrency,
  AccountPortfolio,
  AccountRange,
  AccountStrategy,
  AccountStructure,
  AccountType,
} from 'types/account';
import { map } from 'rxjs/operators';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameDay } from 'date-fns/isSameDay';
import { eachMonthOfInterval } from 'date-fns/eachMonthOfInterval';
import { isSameMonth } from 'date-fns/isSameMonth';
import { addMinutes } from 'date-fns/addMinutes';

export interface PortfolioState {
  list: null | PortfolioPosition[];
  total: null | { total: number };
  broker: null | AccountBroker;
  currency: null | AccountCurrency;
  strategy: null | AccountStrategy;
  portfolio: null | AccountPortfolio;
  leadToCurrency: null | AccountCurrency;
  range: null | AccountRange;
  balance: null | AccountBalance;
  balanceHistory: null | AccountBalanceHistory;
  structure: null | AccountStructure;
  type: null | AccountType;
}

export class PortfolioStore extends WithQueue<PortfolioState> {
  readonly list$: Observable<PortfolioPosition[] | null> = this.select((state: PortfolioState) => state.list);
  readonly total$: Observable<{ total: number } | null> = this.select((state: PortfolioState) => state.total);
  readonly portfolio$: Observable<null | AccountPortfolio> = this.select((state: PortfolioState) => state.portfolio);
  readonly broker$: Observable<AccountBroker | null> = this.select((state: PortfolioState) => state.broker);
  readonly type$: Observable<AccountType | null> = this.select((state: PortfolioState) => state.type);
  readonly strategy$: Observable<AccountStrategy | null> = this.select((state: PortfolioState) => state.strategy);
  readonly currency$: Observable<null | AccountCurrency> = this.select((state: PortfolioState) => state.currency);
  readonly leadToCurrency$: Observable<null | AccountCurrency> = this.select(
    (state: PortfolioState) => state.leadToCurrency
  );
  readonly range$: Observable<null | AccountRange> = this.select((state: PortfolioState) => state.range);
  readonly balance$: Observable<null | AccountBalance> = this.select((state: PortfolioState) => state.balance);
  readonly balanceHistory$: Observable<null | AccountBalanceHistory> = this.select(
    (state: PortfolioState) => state.balanceHistory
  );
  readonly structure$: Observable<null | AccountStructure> = this.select((state: PortfolioState) => state.structure);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      total: null,
      broker: null,
      currency: null,
      portfolio: null,
      leadToCurrency: null,
      range: null,
      balance: null,
      balanceHistory: null,
      structure: null,
      type: null,
      strategy: null,
    });
  }

  updateList = this.updater(
    (state: PortfolioState, list: PortfolioPosition[] | null): PortfolioState => ({
      ...state,
      list,
    })
  );

  updateTotal = this.updater(
    (state: PortfolioState, total: { total: number } | null): PortfolioState => ({
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

  updateType = this.updater(
    (state: PortfolioState, type: null | AccountType): PortfolioState => ({
      ...state,
      type,
    })
  );

  updateStrategy = this.updater(
    (state: PortfolioState, strategy: null | AccountStrategy): PortfolioState => ({
      ...state,
      strategy,
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
    (state: PortfolioState, leadToCurrency: null | AccountCurrency): PortfolioState => ({
      ...state,
      leadToCurrency,
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

  readonly updateBalanceHistory = this.updater(
    (state: PortfolioState, balanceHistory: null | AccountBalanceHistory): PortfolioState => ({
      ...state,
      balanceHistory,
    })
  );

  readonly updateStructure = this.updater(
    (state: PortfolioState, structure: null | AccountStructure): PortfolioState => ({
      ...state,
      structure,
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
            this.updateTotal(result ? { total: result.total } : null);
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
          .pipe(tap((response: Response<AccountBalance>) => this.updateBalance(response && response.data)))
      )
    )
  );

  readonly loadBalanceHistory = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api.getAccountBalanceHistory(params).pipe(
          map(
            (response: Response<AccountBalanceHistory>) =>
              response.data && this._getAccountBalance(response.data, params['from'], params['to'])
          ),
          tap((data: AccountBalanceHistory) => this.updateBalanceHistory(data))
        )
      )
    )
  );

  _getAccountBalance(data: AccountBalanceHistory, from: string, to: string): AccountBalanceHistory {
    const dateFrom = new Date(from).setUTCHours(12);
    const dateTo = new Date(to).setUTCHours(12);
    const timezoneOffset = new Date().getTimezoneOffset() * -1;

    const rangeDayArray = eachDayOfInterval({
      start: dateFrom,
      end: dateTo,
    }).map((item: Date) => addMinutes(item, timezoneOffset));

    if (rangeDayArray.length === data.items.length) {
      return data;
    }

    if (rangeDayArray.length <= 31) {
      const list: AccountBalanceHistoryItem[] = [];

      for (let i = 0; i < rangeDayArray.length; i++) {
        const findIndex = data.items.findIndex((item) => isSameDay(rangeDayArray[i], new Date(item.date)));

        if (findIndex !== -1) {
          list.push(data.items[findIndex]);
        } else if (i === 0) {
          list.push({ date: rangeDayArray[i].toISOString(), balance: 0 });
        } else {
          list.push({ date: rangeDayArray[i].toISOString(), balance: list[i - 1].balance });
        }
      }

      return { ...data, items: list };
    }

    const rangeMonthArray = eachMonthOfInterval({ start: dateFrom, end: dateTo });
    const list: AccountBalanceHistoryItem[] = [];

    for (let i = 0; i < rangeMonthArray.length; i++) {
      const findIndex = data.items.findIndex((item) => isSameMonth(rangeMonthArray[i], new Date(item.date)));

      if (findIndex !== -1) {
        list.push(data.items[findIndex]);
      } else if (i === 0) {
        list.push({ date: rangeMonthArray[i].toISOString(), balance: 0 });
      } else {
        list.push({ date: rangeMonthArray[i].toISOString(), balance: list[i - 1].balance });
      }
    }

    return { ...data, items: list };
  }

  readonly loadStructure = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api
          .getAccountStructure(params)
          .pipe(tap((response: Response<AccountStructure>) => this.updateStructure(response.data)))
      )
    )
  );
}
