import { Injector } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { DialogService } from '@ui/components/dialog';
import { DialogTradeComponent } from './dialog.component';
import { RequestTradeComponent } from '../request/request.component';
import { ConfirmTradeComponent } from '../confirm/confirm.component';
import { TradeTokenComponent } from '../token/token.component';

export class TradeDialogService {
  readonly #dialog: DialogService;

  componentTradeDialog: PolymorpheusContent<DialogTradeComponent> | null = null;
  componentTradeRequest: PolymorpheusContent<RequestTradeComponent> | null = null;
  componentTradeConfirm: PolymorpheusContent<ConfirmTradeComponent> | null = null;
  componentTradeToken: PolymorpheusContent<TradeTokenComponent> | null = null;

  constructor(dialog: DialogService) {
    this.#dialog = dialog;
  }

  openTradeDialog(injector: Injector): Observable<any> {
    return this.open(this.getComponentTradeDialog(injector), { closeable: false, appearance: 'medium-block' });
  }

  openTradeRequest(injector: Injector, data: any = null): Observable<any> {
    return this.open(this.getComponentTradeRequest(injector), { ...data, appearance: 'small-block' });
  }

  openTradeConfirm(injector: Injector, data: any = null): Observable<any> {
    return this.open(this.getComponentTradeConfirm(injector), { ...data, appearance: 'small-block' });
  }

  openTradeToken(injector: Injector, data: any = null): Observable<any> {
    return this.open(this.getComponentTradeToken(injector), { ...data, appearance: 'small-block' });
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

  protected async getComponentTradeRequest(injector: Injector): Promise<PolymorpheusContent<RequestTradeComponent>> {
    if (this.componentTradeRequest === null) {
      this.componentTradeRequest = await import('../request/request.component')
        .then((c) => c.RequestTradeComponent)
        .then((c) => new PolymorpheusComponent(c, injector));
    }

    return this.componentTradeRequest;
  }

  protected async getComponentTradeConfirm(injector: Injector): Promise<PolymorpheusContent<ConfirmTradeComponent>> {
    if (this.componentTradeConfirm === null) {
      this.componentTradeConfirm = await import('../confirm/confirm.component')
        .then((c) => c.ConfirmTradeComponent)
        .then((c) => new PolymorpheusComponent(c, injector));
    }

    return this.componentTradeConfirm;
  }

  protected async getComponentTradeToken(injector: Injector): Promise<PolymorpheusContent<TradeTokenComponent>> {
    if (this.componentTradeToken === null) {
      this.componentTradeToken = await import('../token/token.component')
        .then((c) => c.TradeTokenComponent)
        .then((c) => new PolymorpheusComponent(c, injector));
    }

    return this.componentTradeToken;
  }
}
