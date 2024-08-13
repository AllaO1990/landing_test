import { Injectable } from '@angular/core';
import { StockInstrument, StockListItems, StockListItemWithPrice, StockPrice, WithLastPrice } from 'types/stock';
import { getPriceIncrement } from 'utils/get-price-increment';

@Injectable()
export class StockService {
  public getListWithPrice(
    list: StockListItems | null,
    price: StockPrice<WithLastPrice> | null
  ): StockListItemWithPrice[] {
    if (!list) {
      return [];
    }

    if (!price) {
      return list.map((item: StockInstrument) => ({
        ...item,
        price: null,
        change: null,
        changePercent: null,
        increment: null,
      }));
    }

    return list.map((item: StockInstrument) => {
      if (!price[item.id]) {
        return {
          ...item,
          price: null,
          change: null,
          changePercent: null,
          increment: null,
        };
      }

      const { prev, last, minPriceIncrement } = price[item.id] as WithLastPrice;

      return {
        ...item,
        price: last,
        change: last - prev,
        changePercent: ((last - prev) / last) * 100,
        increment: getPriceIncrement(minPriceIncrement),
      };
    });
  }
}
