import { ContextActionPlugin } from 'types/context-action-plugin';
import { inject } from '@angular/core';
import { TuiDialogService } from '@taiga-ui/core';
import { ContextAction } from 'types/context-action';
import { DeletePosition } from './delete-position';
import { DataAccessIdeaService } from '../data-access.service';
import { DataAccessIdeaStore } from '../store';
import { ApiIdeaService } from '../api.service';

export class ActionIdeaDeletePosition extends ContextActionPlugin {
	readonly #dialog: TuiDialogService = inject(TuiDialogService);
	readonly #service: DataAccessIdeaService = inject(DataAccessIdeaService);
	readonly #store: DataAccessIdeaStore = inject(DataAccessIdeaStore);
	readonly #api: ApiIdeaService = inject(ApiIdeaService);

	condition(type: string): boolean {
		return type === 'deletePosition';
	}

	getAction(): ContextAction {
		return new DeletePosition(this.#service, this.#store, this.#api, this.#dialog);
	}
}
