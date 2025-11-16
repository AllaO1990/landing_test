import { Injectable, Injector } from '@angular/core';
import { DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { RequestTradeComponent } from '../request/request.component';
import { from, Observable, switchMap } from 'rxjs';
import { concatProperties } from 'utils/concat-properties';

@Injectable()
export class TradeFormDialogService {
  readonly #dialog: DialogService;

  componentTradeRequest: PolymorpheusContent<RequestTradeComponent> | null = null;

  constructor(dialog: DialogService) {
    this.#dialog = dialog;
  }

  protected open(component: Promise<PolymorpheusContent>, data: any = null) {
    return from(component).pipe(switchMap((c) => this.#dialog.open(c, data)));
  }

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
