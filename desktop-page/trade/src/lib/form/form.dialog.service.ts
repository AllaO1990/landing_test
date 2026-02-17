import { Injector } from '@angular/core';
import { DialogCoreService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { RequestTradeComponent } from '../request/request.component';
import { Observable } from 'rxjs';
import { concatProperties } from 'utils/concat-properties';

export class TradeFormDialogService extends DialogCoreService {
	componentTradeRequest: PolymorpheusContent<RequestTradeComponent> | null = null;

	openTradeRequest(injector: Injector, data: any = null): Observable<any> {
		return this.open(this.getComponentTradeRequest(injector), concatProperties('medium-block-flex', data));
	}

	protected async getComponentTradeRequest(injector: Injector): Promise<PolymorpheusContent<RequestTradeComponent>> {
		if (this.componentTradeRequest === null) {
			this.componentTradeRequest = await import('../request/request.component')
				.then((c) => c.RequestTradeComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentTradeRequest;
	}
}
