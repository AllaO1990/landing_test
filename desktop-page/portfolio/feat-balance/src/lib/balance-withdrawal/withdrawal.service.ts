import { DialogCoreService } from '../dialog/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { DialogService } from '@ui/components/dialog';
import { Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { WithdrawalComponent } from './withdrawal.component';

export class BalanceWithdrawalService extends DialogCoreService {
	componentDeposit: PolymorpheusContent<WithdrawalComponent> | null = null;

	constructor(dialog: DialogService) {
		super(dialog);
	}

	openDialog(injector: Injector, data: any = {}): Observable<any> {
		return this.open(this.getComponentWithdrawal(injector), {
			closeable: false,
			appearance: 'small-block',
			...data,
		});
	}

	protected async getComponentWithdrawal(injector: Injector): Promise<PolymorpheusContent<WithdrawalComponent>> {
		if (this.componentDeposit === null) {
			this.componentDeposit = await import('./withdrawal.component')
				.then((c) => c.WithdrawalComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentDeposit;
	}
}
