import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TradeFormComponent } from '../form/form.component';
import { TuiButton } from '@taiga-ui/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../common/api.service';
import { TradeStore } from '../common/store';

@Component({
  selector: 'trade-layout',
  standalone: true,
  imports: [TradeFormComponent, TuiButton, ReactiveFormsModule],
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
export class LayoutComponent {
  readonly #api: ApiService = inject(ApiService);
  readonly #store: TradeStore = inject(TradeStore);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly formGroup: FormGroup = new FormGroup({
    trade: new FormControl(null),
  });

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    console.log(this.formGroup.value);

    const { filter, entry } = this.formGroup.value.trade;
    const { account, instrument } = filter;
    const { total, ...order } = entry[0];

    this.#store.addOrder({
      ...order,
      accountId: account.accountId,
      instrumentId: instrument.id,
    });

    // this.#api
    //   .setOrder({
    //     ...order,
    //     accountId: account.accountId,
    //     instrumentId: instrument.id,
    //   })
    //   .subscribe((res) => console.log(res));
    // this.#dialog.openTradeConfirm(this.#injector).subscribe((value) => console.log(value));
    // this.context.$implicit.complete({ re: 're' });
  }
}

// {
//   "accountId": "e5221fa7-c348-4f31-9fd0-72ec896f2103",
//   "direction": true,
//   "instrumentId": "72187db2-44d8-4b2e-8b43-c41fd30c4a39",
//   "orderType": 1,
//   "price": 110,
//   "quantity": 10,
//   "sourceId": 0
// }
