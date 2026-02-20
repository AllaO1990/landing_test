import {Injector} from '@angular/core';
import {from, Observable, switchMap} from 'rxjs';
import {PolymorpheusComponent, PolymorpheusContent} from '@taiga-ui/polymorpheus';
import {DialogService} from '@ui/components/dialog';
import {DialogTradeComponent} from './dialog.component';
import {ConfirmTradeComponent} from '../confirm/confirm.component';
import {concatProperties} from 'utils/concat-properties';

export class TradeDialogService {
	readonly #dialog: DialogService;

	componentTradeDialog: PolymorpheusContent<DialogTradeComponent> | null = null;
	componentTradeConfirm: PolymorpheusContent<ConfirmTradeComponent> | null = null;

	constructor(dialog: DialogService) {
		this.#dialog = dialog;
	}

	openTradeDialog(injector: Injector, data: any): Observable<any> {
		return this.open(this.getComponentTradeDialog(injector), { closeable: false, appearance: 'big-block', data });
	}

	openTradeConfirm(injector: Injector, data: any = null): Observable<any> {
		return this.open(this.getComponentTradeConfirm(injector), concatProperties('small-block', data));
	}

	protected open(component: Promise<PolymorpheusContent>, data: any = null) {
		return from(component).pipe(switchMap((c) => this.#dialog.open(c, data)));
	}

	protected async getComponentTradeDialog(injector: Injector): Promise<PolymorpheusContent<DialogTradeComponent>> {
		if (this.componentTradeDialog === null) {
			this.componentTradeDialog = await import('./dialog.component')
				.then((c) => c.DialogTradeComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentTradeDialog;
	}

	protected async getComponentTradeConfirm(injector: Injector): Promise<PolymorpheusContent<ConfirmTradeComponent>> {
		if (this.componentTradeConfirm === null) {
			this.componentTradeConfirm = await import('../confirm/confirm.component')
				.then((c) => c.ConfirmTradeComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentTradeConfirm;
	}
}
