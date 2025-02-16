import { inject, Pipe, PipeTransform } from '@angular/core';
import { AccountFacade } from 'stores/facades/account.facade';
import { map, Observable, of } from 'rxjs';
import { AccountBroker } from 'types/account';

@Pipe({
  name: 'getBrokerName',
  standalone: true,
})
export class GetBrokerPipe implements PipeTransform {
  readonly #store: AccountFacade | null = inject(AccountFacade, { optional: true });

  transform(value: number | null): Observable<null | string> {
    if (this.#store === null) {
      return of(null);
    }

    return this.#store.brokersMap$.pipe(
      map((brokersMap: Map<number | null, AccountBroker>) => {
        const broker = brokersMap.get(value);

        return broker ? broker.broker : null;
      })
    );
  }
}
