import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { DialogCoreService, DialogService } from '@ui/components/dialog';
import { PortfolioBalanceComponent } from './balance.component';

export class PortfolioBalanceService extends DialogCoreService {
	componentDeposit: PolymorpheusContent<PortfolioBalanceComponent> | null = null;

	constructor(dialog: DialogService) {
		super(dialog);
	}

	openDialog(injector: Injector, data: object = {}): Observable<object> {
		return this.open(this.getComponent(injector), {
			closeable: false,
			appearance: 'dialog-block',
			...data,
		});
	}

	protected async getComponent(injector: Injector): Promise<PolymorpheusContent<PortfolioBalanceComponent>> {
		if (this.componentDeposit === null) {
			this.componentDeposit = await import('./balance.component')
				.then((c) => c.PortfolioBalanceComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentDeposit;
	}
}
