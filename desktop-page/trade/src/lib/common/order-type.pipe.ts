import { DestroyRef, inject, Pipe, PipeTransform } from '@angular/core';
import { TradeStore } from './store';
import { map, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeOrderType, TradeOrderTypes } from './api.types';

@Pipe({
  name: 'tradeOrderType',
  standalone: true,
})
export class OrderTypePipe implements PipeTransform {
  readonly #store: TradeStore = inject(TradeStore);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  readonly #orderTypes$ = this.#store.orderTypes$.pipe();

  transform(value: { id: number; type: string } | null, ...args: any[]): Observable<string | null> {
    return this.#orderTypes$.pipe(
      takeUntilDestroyed(this.#destroyRef),
      map((list: TradeOrderTypes | null) => {
        if (!list) {
          return null;
        }

        if (value === null) {
          return null;
        }

        const type = list.find((item: TradeOrderType) => item.id === value.id && item.type === value.type);

        return type ? type.name : `—`;
      })
    );
  }
}
