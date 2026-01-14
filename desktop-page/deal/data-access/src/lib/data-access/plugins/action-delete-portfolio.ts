import { ContextActionPlugin } from 'types/context-action-plugin';
import { inject } from '@angular/core';
import { TuiDialogService } from '@taiga-ui/core';
import { ContextAction } from 'types/context-action';
import { DeletePosition } from './delete-position';
import { DataAccessDealService } from '../data-access.service';
import { DataAccessDealStore } from '../store';
import { ApiDealService } from '../api.service';

export class ActionDealDeletePosition extends ContextActionPlugin {
	readonly #dialog: TuiDialogService = inject(TuiDialogService);
	readonly #service: DataAccessDealService = inject(DataAccessDealService);
	readonly #store: DataAccessDealStore = inject(DataAccessDealStore);
	readonly #api: ApiDealService = inject(ApiDealService);

	condition(type: string): boolean {
		return type === 'deletePosition';
	}

	getAction(): ContextAction {
		return new DeletePosition(this.#service, this.#store, this.#api, this.#dialog);
	}
}
