import { TuiPopover } from '@taiga-ui/cdk';
import { inject } from '@angular/core';
import { POLYMORPHEUS_CONTEXT, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { DialogService } from '@ui/components/dialog';
import { from, switchMap } from 'rxjs';

export class DialogCoreComponent {
	readonly size = 's';
	readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, { optional: true });

	onCancel(event: Event): void {
		event.preventDefault();

		if (this.context) {
			this.context.completeWith(null);
		}
	}
}

export class DialogCoreService {
	readonly #dialog: DialogService;

	constructor(dialog: DialogService) {
		this.#dialog = dialog;
	}

	protected open(component: Promise<PolymorpheusContent>, data: any = null) {
		return from(component).pipe(switchMap((c) => this.#dialog.open(c, data)));
	}
}
