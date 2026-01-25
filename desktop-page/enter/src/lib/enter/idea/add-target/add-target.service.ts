import { DialogCoreService, DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { AddTargetComponent } from './add-target.component';

export class AddTargetService extends DialogCoreService {
	component: PolymorpheusContent<AddTargetComponent> | null = null;

	constructor(dialog: DialogService) {
		super(dialog);
	}

	openDialog(injector: Injector, data: any = {}): Observable<any> {
		return this.open(this.getComponentAddTarget(injector), {
			closeable: false,
			appearance: 'medium-block-flex',
			...data,
		});
	}

	protected async getComponentAddTarget(injector: Injector): Promise<PolymorpheusContent<AddTargetComponent>> {
		if (this.component === null) {
			this.component = await import('./add-target.component')
				.then((c) => c.AddTargetComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.component;
	}
}
