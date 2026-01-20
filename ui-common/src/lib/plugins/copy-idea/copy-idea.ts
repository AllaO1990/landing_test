import { EventSelected } from 'types/events';
import { ContextAction } from 'types/context-action';
import { Position } from 'types/position';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { QueryParams } from 'utils/query-params';

export class CopyIdea extends ContextAction {
  constructor(private readonly _facade: IdeaFacade, private readonly _queryParams: QueryParams) {
    super();
  }

  action(position: Position) {
    this._facade.loadAndCopyIdea(position.id);

    return this._queryParams.update({
      type: EventSelected.IDEA,
      id: position.id,
      dialog: 'visible',
    });
  }
}
