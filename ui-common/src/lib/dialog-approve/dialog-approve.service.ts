import { DialogCoreService, DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { DialogApproveComponent } from './dialog-approve.component';

export class DialogApproveService extends DialogCoreService {
	component: PolymorpheusContent<DialogApproveComponent> | null = null;

	constructor(dialog: DialogService) {
		super(dialog);
	}

	openDialog(injector: Injector, data: any = {}): Observable<any> {
		return this.open(this.getComponentApprove(injector), {
			closeable: false,
			appearance: 'dialog-remove',
			...data,
		});
	}

	protected async getComponentApprove(injector: Injector): Promise<PolymorpheusContent<DialogApproveComponent>> {
		if (this.component === null) {
			this.component = await import('./dialog-approve.component')
				.then((c) => c.DialogApproveComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.component;
	}
}
