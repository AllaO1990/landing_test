import { Injector } from '@angular/core';
import { DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { Observable } from 'rxjs';
import { DepositComponent } from './deposit.component';
import { DialogCoreService } from '../dialog/dialog';

export class BalanceDepositService extends DialogCoreService {
	componentDeposit: PolymorpheusContent<DepositComponent> | null = null;

	constructor(dialog: DialogService) {
		super(dialog);
	}

	openDialog(injector: Injector, data: any = {}): Observable<any> {
		return this.open(this.getComponentDeposit(injector), {
			closeable: false,
			appearance: 'small-block',
			...data,
		});
	}

	protected async getComponentDeposit(injector: Injector): Promise<PolymorpheusContent<DepositComponent>> {
		if (this.componentDeposit === null) {
			this.componentDeposit = await import('./deposit.component')
				.then((c) => c.DepositComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentDeposit;
	}
}
