import { DialogCoreService, DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { AddEntryComponent } from './add-entry.component';

export class AddEntryService extends DialogCoreService {
	component: PolymorpheusContent<AddEntryComponent> | null = null;

	constructor(dialog: DialogService) {
		super(dialog);
	}

	openDialog(injector: Injector, data: object | null = {}): Observable<null | object> {
		return this.open(this.getComponentAddEntry(injector), {
			closeable: false,
			appearance: 'medium-block-flex',
			...data,
		});
	}

	protected async getComponentAddEntry(injector: Injector): Promise<PolymorpheusContent<AddEntryComponent>> {
		if (this.component === null) {
			this.component = await import('./add-entry.component')
				.then((c) => c.AddEntryComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.component;
	}
}
