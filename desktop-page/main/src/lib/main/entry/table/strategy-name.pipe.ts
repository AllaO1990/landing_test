import { Pipe, PipeTransform } from '@angular/core';
import { StockStrategy, StockStrategyDirectory } from 'types/stock-strategy';

@Pipe({
  name: 'strategyName',
  standalone: true,
})
export class StrategyNamePipe implements PipeTransform {
  transform(value: StockStrategy): string {
    return StockStrategyDirectory[value];
  }
}
