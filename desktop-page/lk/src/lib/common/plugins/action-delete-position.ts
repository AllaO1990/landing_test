import { DeletePosition } from '../delete-position';
import { inject } from '@angular/core';
import { ContextAction } from 'types/context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { TuiDialogService } from '@taiga-ui/core';

export class ActionDeletePosition extends ContextActionPlugin {
	readonly #facade: IdeaFacade = inject(IdeaFacade);
	readonly #dialog: TuiDialogService = inject(TuiDialogService);

	condition(type: string): boolean {
		return type === 'deletePosition';
	}

	getAction(): ContextAction {
		return new DeletePosition(this.#facade, this.#dialog);
	}
}
