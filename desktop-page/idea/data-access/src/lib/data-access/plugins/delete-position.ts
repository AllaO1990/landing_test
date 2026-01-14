import { ContextAction } from 'types/context-action';
import { TuiDialogService } from '@taiga-ui/core';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { ApiIdeaService } from '../api.service';
import { DataAccessIdeaStore } from '../store';
import { DataAccessIdeaService } from '../data-access.service';
import { of, switchMap } from 'rxjs';
import { Response } from 'types/response';
import { Position } from 'types/position';

export class DeletePosition extends ContextAction {
	constructor(
		private readonly _service: DataAccessIdeaService,
		private readonly _store: DataAccessIdeaStore,
		private readonly _api: ApiIdeaService,
		private readonly _dialog: TuiDialogService
	) {
		super();
	}

	action(position: Position): void {
		const ideaId = position.id;

		if (ideaId !== null) {
			this._dialog
				.open<boolean>(TUI_CONFIRM, {
					appearance: 'dialog-confirm',
					size: 'auto',
					closeable: false,
					data: {
						content: `<p class="tui-text_h6">Удалить идею ${position.instrument.ticker} безвозвратно?</h2>`,
						yes: 'Да',
						no: 'Нет',
					},
				})
				.pipe(
					switchMap((result: boolean) => {
						if (result) {
							return this._api.deleteIdea(ideaId);
						}
						return of(null);
					})
				)
				.subscribe((result: null | Response<number>) => {
					const params = this._service.params();
					if (result !== null && params !== null) {
						this._store.load(params);
					}
				});
		}
	}
}
