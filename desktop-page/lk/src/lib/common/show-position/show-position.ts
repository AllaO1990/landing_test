import { QueryParams } from 'utils/query-params';
import { ContextAction } from 'types/context-action';
import { EventSelected } from 'types/events';

export class ShowPosition extends ContextAction {
	constructor(private readonly _queryParams: QueryParams) {
		super();
	}

	action(item: { id: number | string }) {
		return this._queryParams.update({
			id: item.id,
			type: EventSelected.POSITION,
			dialog: 'visible',
		});
	}
}
