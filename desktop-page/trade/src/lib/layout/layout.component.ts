import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { TuiCheckbox } from '@taiga-ui/kit';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiIcon } from '@taiga-ui/core';
import { TradeDialogService } from '../dialog/dialog.service';
import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'trade-layout',
  standalone: true,
  imports: [
    ListComponent,
    HeaderComponent,
    ItemDirective,
    TuiCheckbox,
    ReactiveFormsModule,
    TuiButton,
    NgTemplateOutlet,
    TuiIcon,
    NgIf,
    AsyncPipe,
    TuiFormatNumberPipe,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeLayoutComponent {
  readonly #service: TradeDialogService = inject(TradeDialogService);

  readonly controlAuto: FormControl<boolean> = new FormControl(true, { nonNullable: true });
  readonly itemHeight = 28;

  listEntry = [
    {
      id: '1',
      type: { name: 'Лимитная цена', id: '1' },
      price: 1.54,
      amount: 4000,
      commission: 4.58,
      total: 6165,
      broker: 'Тинькофф',
      action: { name: 'Продать', id: '2' },
      status: { name: 'ИСПОЛНЕНО', id: '1' },
    },
    {
      id: '2',
      type: { name: 'Лучшая цена', id: '2' },
      price: 1.55,
      amount: 1000,
      commission: 5,
      total: 1555,
      broker: 'Тинькофф',
      action: { name: 'Продать', id: '2' },
      status: { name: 'ИСПОЛНЕНО', id: '1' },
    },
  ];

  listOut = [
    {
      id: '3',
      type: { name: 'Тейк-профит', id: '4' },
      price: 1.5,
      amount: 2000,
      commission: 10,
      total: 3010,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'ИСПОЛНЕНО', id: '1' },
    },
    {
      id: '4',
      type: { name: 'Тейк-профит', id: '4' },
      price: 1.46,
      amount: 1000,
      commission: null,
      total: 1460,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'АКТИВНА', id: '2' },
    },
    {
      id: '5',
      type: { name: 'Тейк-профит', id: '4' },
      price: 1.37,
      amount: 1000,
      commission: null,
      total: 1370,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'АКТИВНА', id: '2' },
    },
    {
      id: '6',
      type: { name: 'Стоп-лосс', id: '5' },
      price: 1.61,
      amount: 4000,
      commission: null,
      total: 6440,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'АКТИВНА', id: '2' },
    },
  ];

  open(event: Event, list: string, data: any = null) {
    event.preventDefault();

    this.#service.openTradeRequest(data).subscribe((value) => {
      if (value) {
        if (list === 'out') {
          this.listOut = this.listOut.map((item) => {
            if (item.id === data.id) {
              return { ...item, price: value.price, amount: value.amount };
            }

            return item;
          });
        } else {
          this.listEntry = this.listEntry.map((item) => {
            if (item.id === data.id) {
              return { ...item, price: value.price, amount: value.amount };
            }

            return item;
          });
        }
      }
    });
  }

  remove(event: Event, list: string, data: any): void {
    event.preventDefault();

    if (list === 'out') {
      this.listOut = this.listOut.filter((item) => item.id !== data.id);
    } else {
      this.listEntry = this.listEntry.filter((item) => item.id !== data.id);
    }
  }
}
