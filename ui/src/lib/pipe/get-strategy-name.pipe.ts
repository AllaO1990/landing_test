import { Pipe, PipeTransform } from '@angular/core';
import { StockStrategyEnums } from 'types/stock-strategy';
import { STOCK_STRATEGY } from 'constants/stock-strategy';

@Pipe({
  name: 'getStrategyName',
  standalone: true,
})
export class GetStrategyNamePipe implements PipeTransform {
  transform(value: StockStrategyEnums): string {
    return STOCK_STRATEGY[value];
  }
}
