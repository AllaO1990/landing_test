import { DialogCoreService, DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { AddStopComponent } from './add-stop.component';

export class AddStopService extends DialogCoreService {
	component: PolymorpheusContent<AddStopComponent> | null = null;

	constructor(dialog: DialogService) {
		super(dialog);
	}

	openDialog(injector: Injector, data: object | null = {}): Observable<null | object> {
		return this.open(this.getComponentAddStop(injector), {
			closeable: false,
			appearance: 'medium-block-flex',
			...data,
		});
	}

	protected async getComponentAddStop(injector: Injector): Promise<PolymorpheusContent<AddStopComponent>> {
		if (this.component === null) {
			this.component = await import('./add-stop.component')
				.then((c) => c.AddStopComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.component;
	}
}
