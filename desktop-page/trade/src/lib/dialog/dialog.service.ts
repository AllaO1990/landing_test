import { Injector } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { DialogService } from '@ui/components/dialog';
import { DialogTradeComponent } from './dialog.component';
import { RequestTradeComponent } from '../request/request.component';
import { ConfirmTradeComponent } from '../confirm/confirm.component';

export class TradeDialogService {
  readonly #dialog: DialogService;
  readonly #injector: Injector;

  componentTradeDialog: PolymorpheusContent<DialogTradeComponent> | null = null;
  componentTradeRequest: PolymorpheusContent<RequestTradeComponent> | null = null;
  componentTradeConfirm: PolymorpheusContent<ConfirmTradeComponent> | null = null;

  constructor(dialog: DialogService, injector: Injector) {
    this.#dialog = dialog;
    this.#injector = injector;
  }

  openTradeDialog(): Observable<any> {
    return this.open(this.getComponentTradeDialog(), { closeable: false, appearance: 'medium-block' });
  }

  openTradeRequest(data: any = null): Observable<any> {
    return this.open(this.getComponentTradeRequest(), { ...data, appearance: 'small-block' });
  }

  openTradeConfirm(data: any = null): Observable<any> {
    return this.open(this.getComponentTradeConfirm(), { ...data, appearance: 'small-block' });
  }

  protected open(component: Promise<PolymorpheusContent>, data: any = null) {
    return from(component).pipe(switchMap((c) => this.#dialog.open(c, data)));
  }

  protected async getComponentTradeDialog(): Promise<PolymorpheusContent<DialogTradeComponent>> {
    if (this.componentTradeDialog === null) {
      this.componentTradeDialog = await import('./dialog.component')
        .then((c) => c.DialogTradeComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    return this.componentTradeDialog;
  }

  protected async getComponentTradeRequest(): Promise<PolymorpheusContent<RequestTradeComponent>> {
    if (this.componentTradeRequest === null) {
      this.componentTradeRequest = await import('../request/request.component')
        .then((c) => c.RequestTradeComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    return this.componentTradeRequest;
  }

  protected async getComponentTradeConfirm(): Promise<PolymorpheusContent<ConfirmTradeComponent>> {
    if (this.componentTradeConfirm === null) {
      this.componentTradeConfirm = await import('../confirm/confirm.component')
        .then((c) => c.ConfirmTradeComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    return this.componentTradeConfirm;
  }
}
