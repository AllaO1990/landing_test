import { QueryParams } from 'utils/query-params';
import { EventSelected } from 'types/events';
import { ContextAction } from 'types/context-action';
import { Position } from 'types/position';

export class NewPosition extends ContextAction {
	constructor(private readonly _queryParams: QueryParams) {
		super();
	}

	action(data: Position) {
		return this._queryParams.update({
			type: EventSelected.STOCK_LIST,
			id: data.instrument.id,
			dialog: 'visible',
		});
	}
}
