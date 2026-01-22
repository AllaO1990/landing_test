import { ContextActionPlugin } from 'types/context-action-plugin';
import { inject } from '@angular/core';
import { TuiDialogService } from '@taiga-ui/core';
import { ContextAction } from 'types/context-action';
import { DeletePosition } from './delete-position';
import { DataAccessDealService } from '../data-access.service';
import { DataAccessIdeasStore } from '../../store';
import { ApiIdeasService } from '../../api.service';

export class ActionDealDeletePosition extends ContextActionPlugin {
	readonly #dialog: TuiDialogService = inject(TuiDialogService);
	readonly #service: DataAccessDealService = inject(DataAccessDealService);
	readonly #store: DataAccessIdeasStore = inject(DataAccessIdeasStore);
	readonly #api: ApiIdeasService = inject(ApiIdeasService);

	condition(type: string): boolean {
		return type === 'deletePosition';
	}

	getAction(): ContextAction {
		return new DeletePosition(this.#service, this.#store, this.#api, this.#dialog);
	}
}
