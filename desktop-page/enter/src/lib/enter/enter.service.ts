import { DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { VtEnterComponent } from './enter.component';
import { Injector } from '@angular/core';
import { from, switchMap } from 'rxjs';

export class EnterDialog {
  readonly #dialog: DialogService;

  componentEnterDialog: PolymorpheusContent<VtEnterComponent> | null = null;

  constructor(dialog: DialogService) {
    this.#dialog = dialog;
  }

  openEnter(injector: Injector, data: any = null) {
    return from(this.getComponentEnter(injector)).pipe(switchMap((c) => this.#dialog.open(c, data)));
  }

  protected async getComponentEnter(injector: Injector): Promise<PolymorpheusComponent<VtEnterComponent>> {
    if (this.componentEnterDialog === null) {
      this.componentEnterDialog = await import('./enter.component')
        .then((c) => c.VtEnterComponent)
        .then((c) => new PolymorpheusComponent(c, injector));
    }

    return this.componentEnterDialog as Promise<PolymorpheusComponent<VtEnterComponent>>;
  }
}
