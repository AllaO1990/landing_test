import { inject, Pipe, PipeTransform } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { Observable, of, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { Params } from '@angular/router';
import { EventSelected } from 'types/events';
import { Position } from 'types/position';

@Pipe({
  name: 'ideaSelectItem',
  standalone: true,
  pure: true,
})
export class SelectItemIdeaPipe implements PipeTransform {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  transform(item: Position, ...args: any[]): Observable<boolean> {
    const id = item.id;

    if (!id) {
      return of(false);
    }

    return this.#queryParams.pipe(
      startWith(this.#queryParams.value()),
      map((value: Params) => {
        return value['id'] === id.toString() && value['type'] === EventSelected.IDEA;
      })
    );
  }
}
