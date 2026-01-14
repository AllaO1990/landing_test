import { QueryParams } from 'utils/query-params';
import { inject } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { ContextAction } from 'types/context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { NewIdea } from '../new-idea';

export class ActionNewIdea extends ContextActionPlugin {
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

	condition(type: string): boolean {
		return type === 'newIdea';
	}

	getAction(): ContextAction {
		return new NewIdea(this.#queryParams);
	}
}
