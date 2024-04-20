import { Pipe, PipeTransform } from '@angular/core';
import { StockListItem, StockListItemPrice, StockPrice } from 'types/stock';

@Pipe({
  name: 'stockPrice',
  standalone: true,
})
export class ListPricePipe implements PipeTransform {
  public transform(
    value: StockListItem,
    price: StockPrice<StockListItemPrice> | null
  ): null | StockListItemPrice {
    if (price === null) {
      return null;
    }

    return price[value.id];
  }
}
