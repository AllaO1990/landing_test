import { ContextAction } from 'types/context-action';
import { TuiDialogService } from '@taiga-ui/core';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { ApiDealService } from '../api.service';
import { DataAccessDealStore } from '../store';
import { DataAccessDealService } from '../data-access.service';
import { of, switchMap } from 'rxjs';
import { Response } from 'types/response';
import { PortfolioPosition } from 'types/portfolio';

export class DeletePosition extends ContextAction {
	constructor(
		private readonly _service: DataAccessDealService,
		private readonly _store: DataAccessDealStore,
		private readonly _api: ApiDealService,
		private readonly _dialog: TuiDialogService
	) {
		super();
	}

	action(position: PortfolioPosition): void {
		const ideaId = position.ideaId;

		if (ideaId !== null) {
			this._dialog
				.open<boolean>(TUI_CONFIRM, {
					appearance: 'dialog-confirm',
					size: 'auto',
					closeable: false,
					data: {
						content: `<p class="tui-text_h6">Удалить сделку ${position.instrument.ticker} безвозвратно?</h2>`,
						yes: 'Да',
						no: 'Нет',
					},
				})
				.pipe(
					switchMap((result: boolean) => {
						if (result) {
							return this._api.deletePortfolio(ideaId);
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
