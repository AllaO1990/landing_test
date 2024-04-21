import {Injectable} from '@angular/core';
import {StockList, StockListItem, StockGroup, StockPrice, StockListPrice, StockListItemWithPrice} from 'types/stock';
import {STOCK_MAPPER} from "./stock.constant";

type StockType = 'moex' | 'futures' | 'currency' | 'metal';

@Injectable()
export class StockService {
  private _defaultMapper = STOCK_MAPPER;

  public getMapGroupList(
    data: StockList,
    groups: StockGroup[],
    map: Map<StockGroup, StockList>
  ): Map<StockGroup, StockList> {
    const mapped: { [key: string]: StockList } = this._getMapList(data, this._getStartList(groups));

    return this._concatListStock(mapped, groups, map);
  }

  private _getStartList(group: StockGroup[]): { [key: string]: StockList } {
    return group.reduce((acc: { [key: string]: StockList }, item: StockGroup) => ({...acc, [item.id]: []}), {});
  }

  private _getMapList(data: StockList, start: { [key: string]: StockList }): { [key: string]: StockList } {
    return data.reduce(
      (acc: { [key: string]: StockList }, item: StockListItem) => {
        const key = this._defaultMapper[item.exchange];

        if (!key) {
          return acc;
        }

        acc[key].push(item);

        return acc;
      },
      start
    );
  }

  private _concatListStock(
    mapped: { [key: string]: StockList },
    groups: StockGroup[],
    map: Map<StockGroup, StockList>
  ): Map<StockGroup, StockList> {
    return groups.reduce((acc: Map<StockGroup, StockList>, item: StockGroup) => {
      if (mapped[item.id] && mapped[item.id].length) {
        acc.set(item, mapped[item.id as StockType].sort(this._sortName()));
      }

      return acc;
    }, map);
  }

  private _sortName(
    stringKey: keyof StockListItem = 'ticker'
  ): (a: StockListItem, b: StockListItem) => 1 | 0 | -1 {
    return (a: StockListItem, b: StockListItem): 1 | 0 | -1 => {
      const nameA: string = (a[stringKey] as string).toUpperCase();
      const nameB: string = (b[stringKey] as string).toUpperCase();

      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      return 0;
    };
  }

  public getListWithPrice(list: StockList | null, price: StockPrice<StockListPrice> | null): StockListItemWithPrice[] {
    if (!list) {
      return [];
    }

    if (!price) {
      return list.map((item: StockListItem) => ({...item, price: null, change: null, changePercent: null}));
    }

    return list.map((item: StockListItem) => {
      if (price[item.id] === null) {
        return ({...item, price: null, change: null, changePercent: null})
      }

      const {prev, last} = price[item.id] as StockListPrice;

      return {...item, price: last, change: last - prev, changePercent: (last - prev) / last * 100}
    });
  }
}
