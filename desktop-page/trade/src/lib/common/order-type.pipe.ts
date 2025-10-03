import { DestroyRef, inject, Pipe, PipeTransform } from '@angular/core';
import { TradeStore } from './store';
import { map, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeOrderTypeDescription, TradeOrderTypesDescription } from './api.types';

@Pipe({
  name: 'tradeOrderType',
  standalone: true,
})
export class OrderTypePipe implements PipeTransform {
  readonly #store: TradeStore = inject(TradeStore);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  readonly #orderTypes$: Observable<TradeOrderTypesDescription | null> = this.#store.orderTypes$.pipe();

  transform(value: { id: number; type: string } | null | string, ...args: any[]): Observable<string | null> {
    return this.#orderTypes$.pipe(
      takeUntilDestroyed(this.#destroyRef),
      map((list: TradeOrderTypesDescription | null) => {
        if (!list) {
          return null;
        }

        if (value === null) {
          return null;
        }

        if (typeof value === 'string') {
          const type = list.find((item: TradeOrderTypeDescription) => item.type === value);

          return type ? type.name : `—`;
        }

        const type = list.find((item: TradeOrderTypeDescription) => item.id === value.id && item.type === value.type);

        return type ? type.name : `—`;
      })
    );
  }
}
