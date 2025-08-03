import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TradeFormComponent } from '../form/form.component';
import { TuiButton } from '@taiga-ui/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../common/api.service';
import { TradeStore } from '../common/store';
import { map, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { getNumberPrecision } from 'utils/get-number-precision';

@Component({
  selector: 'trade-layout',
  standalone: true,
  imports: [TradeFormComponent, TuiButton, ReactiveFormsModule, AsyncPipe],
  templateUrl: './layout.component.html',
  styleUrls: ['../common/dialog.scss', './layout.component.scss'],
  providers: [
    ApiService,
    {
      provide: TradeStore,
      useFactory: (api: ApiService) => new TradeStore(api),
      deps: [ApiService],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit {
  readonly #store: TradeStore = inject(TradeStore);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly formGroup: FormGroup = new FormGroup({
    trade: new FormControl(null),
  });

  readonly isDisabled$: Observable<boolean> = this.formGroup.valueChanges.pipe(
    map((value) => value.trade),
    map((value: { entry: { status: number }[]; out: { status: number }[] }) => {
      const { entry, out } = value;

      if (entry.length === 0 && out.length === 0) {
        return true;
      }

      const entryIndex = entry.findIndex((item) => item.status === 0);
      const outIndex = out.findIndex((item) => item.status === 0);

      return false;
    })
  );

  ngAfterViewInit(): void {
    this.#store.loadOrderTypes();
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    const { filter, entry, out } = this.formGroup.value.trade;
    const { account, instrument, source } = filter;

    const entryOrders = this._getOrders(
      entry.filter((item: { status: number }) => item.status === 0),
      account.accountId,
      instrument.id,
      source.id
    );

    if (entryOrders.length > 0) {
      this.#store.addOrders(entryOrders);

      return;
    }

    const outOrders = this._getOrders(
      out.filter((item: { status: number }) => item.status === 0),
      account.accountId,
      instrument.id,
      source.id
    );

    if (outOrders.length > 0) {
      this.#store.addOrders(outOrders);
    }
  }

  private _getOrders(orders: any[], accountId: string, instrumentId: string, sourceId: number): any[] {
    return orders.map((item) => {
      const { total, quantity, lot, ...order } = item;

      return {
        ...order,
        quantity: getNumberPrecision(quantity / lot, 0),
        lot,
        accountId,
        instrumentId,
        sourceId,
      };
    });
  }
}
