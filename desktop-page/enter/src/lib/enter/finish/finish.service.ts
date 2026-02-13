import { DialogCoreService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { Injector } from '@angular/core';
import { EnterFinishComponent } from './finish.component';

export class FinishService extends DialogCoreService {
	componentEnterDialog: PolymorpheusContent<EnterFinishComponent> | null = null;

	openDialog(injector: Injector, data: any = null) {
		return this.open(this.getComponentFinish(injector), { appearance: 'dialog-block', ...data });
	}

	protected async getComponentFinish(injector: Injector): Promise<PolymorpheusComponent<EnterFinishComponent>> {
		if (this.componentEnterDialog === null) {
			this.componentEnterDialog = await import('./finish.component')
				.then((c) => c.EnterFinishComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentEnterDialog as Promise<PolymorpheusComponent<EnterFinishComponent>>;
	}
}
