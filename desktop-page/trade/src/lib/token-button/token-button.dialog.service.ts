import { Injector } from '@angular/core';
import { DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { TradeTokenComponent } from '../token/token.component';
import { from, Observable, switchMap } from 'rxjs';
import { concatProperties } from 'utils/concat-properties';

export class TradeTokenButtonDialogService {
	readonly #dialog: DialogService;

	componentTradeToken: PolymorpheusContent<TradeTokenComponent> | null = null;

	constructor(dialog: DialogService) {
		this.#dialog = dialog;
	}

	protected open(component: Promise<PolymorpheusContent>, data: any = null) {
		return from(component).pipe(switchMap((c) => this.#dialog.open(c, data)));
	}

	openTradeToken(injector: Injector, data: any = null): Observable<any> {
		return this.open(this.getComponentTradeToken(injector), concatProperties('small-block', data));
	}

	protected async getComponentTradeToken(injector: Injector): Promise<PolymorpheusContent<TradeTokenComponent>> {
		if (this.componentTradeToken === null) {
			this.componentTradeToken = await import('../token/token.component')
				.then((c) => c.TradeTokenComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentTradeToken;
	}

	private _getData(appearance: string, data: any = null): object {
		if (!data) {
			return { appearance };
		}

		return { ...data, appearance };
	}
}
