import { Pipe, PipeTransform } from '@angular/core';
import { StockInstrument } from 'types/stock';

@Pipe({
  name: 'searchDialogListLength',
  standalone: true,
})
export class SearchDialogListLengthPipe implements PipeTransform {
  transform(total: null | number, limit: number): null | number {
    return total && Math.ceil(total / limit);
  }
}

@Pipe({
  name: 'searchDialogItemCondition',
  standalone: true,
})
export class SearchDialogItemCondition implements PipeTransform {
  transform(item: StockInstrument, ...args: any[]): boolean {
    return !item.inSub && item.subscriptionStatus !== 3;
  }
}
