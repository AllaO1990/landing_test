import { QueryParams } from 'utils/query-params';
import { ContextAction } from 'types/context-action';
import { EventSelected } from 'types/events';

export class ShowTransaction extends ContextAction {
	constructor(private readonly _queryParams: QueryParams) {
		super();
	}

	action(item: { ideaId: number | string }) {
		return this._queryParams.update({
			id: item.ideaId,
			type: EventSelected.TRANSACTION,
			dialog: 'visible',
		});
	}
}
