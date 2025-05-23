import { QueryParams } from 'utils/query-params';
import { EventSelected } from 'types/events';
import { ContextAction } from 'types/context-action';
import { Position } from 'types/position';

export class ShowPosition extends ContextAction {
  constructor(private readonly _queryParams: QueryParams) {
    super();
  }

  action(position: Position) {
    return this._queryParams.update({
      type: EventSelected.POSITION,
      id: position.id,
      dialog: 'visible',
    });
  }
}
