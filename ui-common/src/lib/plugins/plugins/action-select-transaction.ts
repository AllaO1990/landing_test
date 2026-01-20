import { ContextAction } from 'types/context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { QueryParams } from 'utils/query-params';
import { inject } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { SelectTransaction } from '../select-transaction';

export class ActionSelectTransaction extends ContextActionPlugin {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  condition(type: string): boolean {
    return type === 'selectTransaction';
  }

  getAction(): ContextAction {
    return new SelectTransaction(this.#queryParams);
  }
}
