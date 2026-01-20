import { NewPosition } from '../new-position';
import { QueryParams } from 'utils/query-params';
import { inject } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { ContextAction } from 'types/context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';

export class ActionNewPosition extends ContextActionPlugin {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  condition(type: string): boolean {
    return type === 'newPosition';
  }

  getAction(): ContextAction {
    return new NewPosition(this.#queryParams);
  }
}
