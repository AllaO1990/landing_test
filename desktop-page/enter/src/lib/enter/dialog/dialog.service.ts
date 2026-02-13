import { TuiPopoverService } from '@taiga-ui/cdk';
import { Injectable, Injector } from '@angular/core';
import { EnterDialogComponent } from './dialog.component';
import { DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { from, Observable, switchMap } from 'rxjs';
import { TUI_DIALOGS } from '@taiga-ui/core';

export class EnterDialogService {
	readonly #dialog: DialogService;

	componentEnterDialog: PolymorpheusContent<EnterDialogComponent> | null = null;

	constructor(dialog: DialogService) {
		this.#dialog = dialog;
	}

	protected open(component: Promise<PolymorpheusContent>, data: any = null) {
		return from(component).pipe(switchMap((c) => this.#dialog.open(c, data)));
	}

	openEnterDialog(injector: Injector, data: any = null): Observable<any> {
		return this.open(this.getComponentEnterDialog(injector), data);
	}

	protected async getComponentEnterDialog(injector: Injector): Promise<PolymorpheusContent<EnterDialogComponent>> {
		if (this.componentEnterDialog === null) {
			this.componentEnterDialog = await import('../enter.component')
				.then((c) => c.VtEnterComponent)
				.then((c) => new PolymorpheusComponent(c, injector));
		}

		return this.componentEnterDialog;
	}
}

@Injectable({
	providedIn: 'any',
	useFactory: () => new EnterFullScreenDialogService(TUI_DIALOGS, EnterDialogComponent),
})
export class EnterFullScreenDialogService extends TuiPopoverService<any, any> {}
