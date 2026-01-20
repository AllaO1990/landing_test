import { ContextAction } from 'types/context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { QueryParams } from 'utils/query-params';
import { inject } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { ShowTransaction } from '../show-transaction';

export class ActionShowTransaction extends ContextActionPlugin {
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

	condition(type: string): boolean {
		return type === 'showTransaction';
	}

	getAction(): ContextAction {
		return new ShowTransaction(this.#queryParams);
	}
}
