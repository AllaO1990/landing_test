import { inject, Pipe, PipeTransform } from '@angular/core';
import { TuiFormatNumberPipe } from '@taiga-ui/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { TuiNumberFormatSettings } from '@taiga-ui/core/tokens';

@Pipe({
  name: 'chartNumberFormat',
  standalone: true,
})
export class ChartNumberFormatPipe implements PipeTransform {
  #format: TuiFormatNumberPipe = inject(TuiFormatNumberPipe);

  transform(value: number, ...args: any[]): Observable<string> {
    const valueAbs = Math.abs(value);
    let settings: Partial<TuiNumberFormatSettings> = { precision: undefined, decimalMode: 'always' };
    let numb = value;
    let unit = '';

    if (valueAbs / 1000 >= 1 && valueAbs / 1000 <= 999) {
      settings = { ...settings, precision: 0 };
      numb = value / 1000;
      unit = ' тыс.';
    }

    if (valueAbs / 1000000 >= 1) {
      settings = { ...settings, precision: 1 };
      numb = value / 1000000;
      unit = ' млн.';
    }

    return this.#format.transform(numb, settings).pipe(map((value: string) => `${value}${unit}`));
  }
}
