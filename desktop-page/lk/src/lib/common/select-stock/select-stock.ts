import { QueryParams } from 'utils/query-params';
import { ContextAction } from 'types/context-action';
import { EventSelected } from 'types/events';

export class SelectStock extends ContextAction {
  constructor(private readonly _queryParams: QueryParams) {
    super();
  }

  action(id: string | number) {
    return this._queryParams.update({
      id,
      type: EventSelected.STOCK_LIST,
    });
  }
}
