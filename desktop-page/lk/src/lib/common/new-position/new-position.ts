import { QueryParams } from 'utils/query-params';
import { EventSelected } from 'types/events';
import { ContextAction } from 'types/context-action';

export class NewPosition extends ContextAction {
	constructor(private readonly _queryParams: QueryParams) {
		super();
	}

	action(position: { instrument: { id: string | number } }) {
		return this._queryParams.update({
			type: EventSelected.STOCK_LIST,
			id: position.instrument.id,
			dialog: 'visible',
		});
	}
}
