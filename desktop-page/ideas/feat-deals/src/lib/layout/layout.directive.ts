import { inject, Pipe, PipeTransform } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { Params } from '@angular/router';
import { PortfolioPosition } from 'types/portfolio';
import { EventSelected } from 'types/events';

@Pipe({
  name: 'dealSelectItem',
  standalone: true,
  pure: true,
})
export class SelectItemPipe implements PipeTransform {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  transform(item: PortfolioPosition, ...args: any[]): Observable<boolean> {
    return this.#queryParams.pipe(
      startWith(this.#queryParams.value()),
      map((value: Params) => value['id'] === item.ideaId.toString() && value['type'] === EventSelected.TRANSACTION)
    );
  }
}
