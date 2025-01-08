import { inject, Pipe, PipeTransform } from '@angular/core';
import { AccountFacade } from 'stores/facades/account.facade';
import { filter, map, Observable, of } from 'rxjs';
import { AccountBroker } from 'types/account';

@Pipe({
  name: 'getBroker',
  standalone: true,
})
export class GetBrokerPipe implements PipeTransform {
  private readonly _service: AccountFacade | null = inject(AccountFacade, { optional: true });

  transform(value: number): Observable<null | string> {
    if (this._service) {
      return this._service.brokers$.pipe(
        filter((list: null | AccountBroker[]): list is AccountBroker[] => list !== null),
        map(
          (list: AccountBroker[]): AccountBroker | null =>
            list.find((item: AccountBroker) => item.brokerId === value) || null
        ),
        map((result: AccountBroker | null) => result && result.broker)
      );
    }
    return of(null);
  }
}
