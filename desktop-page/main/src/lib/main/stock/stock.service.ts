import { Injectable } from '@angular/core';
import { StockList, StockListItem, StockName } from 'types/stock';

type StockType = 'moex' | 'futures' | 'currency' | 'metal';

@Injectable()
export class StockService {
  private _defaultMapper: { [key: string]: StockType } = {
    // 'moex_close': 'moex',
    MOEX_WEEKEND: 'moex',
    MOEX_EVENING_WEEKEND: 'moex',
    FORTS_EVENING: 'futures',
    FX: 'currency',
    FX_MTL: 'metal',
    MOEX_PLUS: 'moex',
    MOEX: 'moex',
  };

  public getListName(
    data: StockList,
    list: StockName[]
  ): { list: StockName[]; stock: Map<StockName, StockList> } {
    const mapped: { [key: string]: StockList } = this._getMapList(data, {
      moex: [],
      futures: [],
      currency: [],
      metal: [],
    });

    return this._concatListStock(list, mapped);
  }

  private _getMapList(
    data: StockList,
    start: { [key: string]: StockList }
  ): { [key: string]: StockList } {
    return data.reduce(
      (acc: { [key: string]: StockList }, item: StockListItem) => {
        const key: StockType = this._defaultMapper[item.exchange];

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
    list: StockName[],
    mapped: { [key: string]: StockList }
  ): { list: StockName[]; stock: Map<StockName, StockList> } {
    const map: Map<StockName, StockList> = new Map();

    return list.reduce(
      (
        acc: { list: StockName[]; stock: Map<StockName, StockList> },
        item: StockName
      ) => {
        if (
          mapped[item.id as StockType] &&
          mapped[item.id as StockType].length
        ) {
          acc.list.push(item);
          acc.stock.set(
            item,
            mapped[item.id as StockType].sort(this._sortName())
          );
        }

        return acc;
      },
      { list: [], stock: map }
    );
  }

  private _sortName(
    stringKey: keyof StockListItem = 'ticker'
  ): (a: StockListItem, b: StockListItem) => 1 | 0 | -1 {
    return (a: StockListItem, b: StockListItem): 1 | 0 | -1 => {
      const nameA: string = a[stringKey].toUpperCase();
      const nameB: string = b[stringKey].toUpperCase();

      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      return 0;
    };
  }
}
