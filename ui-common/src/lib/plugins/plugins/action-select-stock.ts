import { ContextAction } from 'types/context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { QueryParams } from 'utils/query-params';
import { inject } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { SelectStock } from '../select-stock';

export class ActionSelectStock extends ContextActionPlugin {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  condition(type: string): boolean {
    return type === 'selectStock';
  }

  getAction(): ContextAction {
    return new SelectStock(this.#queryParams);
  }
}
