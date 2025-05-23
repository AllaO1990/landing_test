import { ContextAction } from 'types/context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { QueryParams } from 'utils/query-params';
import { inject } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { CopyIdea } from '../copy-idea';
import { IdeaFacade } from 'stores/facades/idea.facade';

export class ActionCopyIdea extends ContextActionPlugin {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #facade: IdeaFacade = inject(IdeaFacade);

  condition(type: string): boolean {
    return type === 'copyIdea';
  }

  getAction(): ContextAction {
    return new CopyIdea(this.#facade, this.#queryParams);
  }
}
