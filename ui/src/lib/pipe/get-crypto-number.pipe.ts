import { Pipe, PipeTransform } from '@angular/core';
import { map, Observable } from 'rxjs';
import { tuiFormatNumber } from '@taiga-ui/core/utils/format';

@Pipe({
  name: 'getCryptoNumber',
  standalone: true,
})
export class GetCryptoNumberPipe implements PipeTransform {
  transform(value$: Observable<string | null>, ...args: any[]) {
    return value$.pipe(
      map((value: string | null) => {
        if (value === null) {
          return value;
        }

        const [ceil] = value.split('.');

        if (ceil.length > 4) {
          return tuiFormatNumber(+value.replace(/\s/g, ''), {
            precision: 2,
            decimalMode: 'always',
          });
        }

        return value;
      })
    );
  }
}
