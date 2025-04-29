import { inject, Pipe, PipeTransform } from '@angular/core';
import { TuiFormatNumberPipe } from '@taiga-ui/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'chartNumberFormat',
  standalone: true,
})
export class ChartNumberFormatPipe implements PipeTransform {
  #format: TuiFormatNumberPipe = inject(TuiFormatNumberPipe);

  transform(value: number, ...args: any[]): Observable<string> {
    let numb = value;
    let unit = '';

    if (value / 1000 >= 1 && value / 1000 <= 99) {
      numb = value / 1000;
      unit = 'тыс.';
    }

    if (value / 1000000 >= 0.1) {
      numb = value / 1000000;
      unit = 'млн.';
    }

    return this.#format
      .transform(numb, { precision: 0, decimalMode: 'always' })
      .pipe(map((value: string) => `${value}${unit}`));
  }
}
