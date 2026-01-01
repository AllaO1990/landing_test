import { QueryParams } from 'utils/query-params';
import { ContextAction } from 'types/context-action';
import { EventSelected } from 'types/events';

export class SelectIdea extends ContextAction {
	constructor(private readonly _queryParams: QueryParams) {
		super();
	}

	action(item: { id: string | number }) {
		return this._queryParams.update({
			id: item.id,
			type: EventSelected.IDEA,
		});
	}
}
