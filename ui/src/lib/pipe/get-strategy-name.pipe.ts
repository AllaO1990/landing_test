import { inject, Pipe, PipeTransform } from '@angular/core';
import { StockStrategyEnums } from 'types/stock-strategy';
import { AccountFacade } from 'stores/facades/account.facade';
import { map, Observable, of } from 'rxjs';
import { AccountStrategies } from 'types/account';

@Pipe({
  name: 'getStrategyName',
  standalone: true,
})
export class GetStrategyNamePipe implements PipeTransform {
  readonly #store: AccountFacade | null = inject(AccountFacade, { optional: true });

  transform(value: StockStrategyEnums): Observable<string | null> {
    if (this.#store === null) {
      return of(null);
    }

    return this.#store.strategiesMap$.pipe(
      map((strategiesMap: Map<string, AccountStrategies>) => {
        const strategy = strategiesMap.get(value);

        return strategy ? strategy.name : null;
      })
    );
  }
}
