import { Injector } from '@angular/core';
import { DialogCoreService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { TradeTokenComponent } from './token.component';
import { Observable } from 'rxjs';
import { concatProperties } from 'utils/concat-properties';

export class TradeTokenDialogService extends DialogCoreService {
	componentTradeToken: PolymorpheusContent<TradeTokenComponent> | null = null;

	openTradeToken(injector: Injector, data: any = null): Observable<any> {
		return this.open(this.getComponentTradeToken(injector), concatProperties('small-block', data));
	}

	protected async getComponentTradeToken(injector: Injector): Promise<PolymorpheusContent<TradeTokenComponent>> {
		if (this.componentTradeToken === null) {
			this.componentTradeToken = await import('./token.component')
				.then((c) => c.TradeTokenComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentTradeToken;
	}
}
