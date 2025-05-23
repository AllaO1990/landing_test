import { ContextAction } from 'types/context-action';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { TuiDialogService } from '@taiga-ui/core';
import { Position } from 'types/position';

export class DeletePosition extends ContextAction {
  constructor(private readonly _facade: IdeaFacade, private readonly _dialog: TuiDialogService) {
    super();
  }

  action(position: Position) {
    const ideaId = position.id;

    if (ideaId !== null) {
      this._dialog
        .open<boolean>(TUI_CONFIRM, {
          appearance: 'dialog-confirm',
          size: 'auto',
          closeable: false,
          data: {
            content: '<p class="tui-text_h6">Удалить идею безвозвратно?</h2>',
            yes: 'Да',
            no: 'Нет',
          },
        })
        .subscribe((result: boolean) => {
          if (result) {
            this._facade.deleteIdea(ideaId);
          }
        });
    }
  }
}
