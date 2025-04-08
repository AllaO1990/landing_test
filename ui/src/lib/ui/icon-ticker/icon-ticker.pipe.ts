import { Pipe, PipeTransform } from '@angular/core';
import { StockInstrument } from 'types/stock';

@Pipe({
  name: 'iconTickerSrc',
  standalone: true,
})
export class IconTickerSrcPipe implements PipeTransform {
  transform(value: StockInstrument, ...args: any[]): string {
    return `/assets/tickers-v2/${value.ticker}.${value.type === 'crypto' ? 'svg' : 'png'}`;
  }
}
